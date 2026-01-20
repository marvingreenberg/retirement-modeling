#!/usr/bin/env python3
import copy
import json

import pandas as pd

# --- Helper Functions ---


def calculate_rmd_amount(age, balance, rmd_start_age):
    if age < rmd_start_age:
        return 0.0
    # Approx Uniform Lifetime Table
    divisor = max(27.4 - (age - 72), 5.0)
    return balance / divisor


def get_marginal_tax_rate(income, brackets):
    for bracket in brackets:
        if income < bracket["limit"]:
            return bracket["rate"]
    return brackets[-1]["rate"]


def calculate_irmaa_cost(agi, tier_1_limit):
    # Simplified 2025/26 IRMAA Surcharges (Annual per couple approx)
    # Tier 1: > $218k -> +$1,600/yr
    # Tier 2: > $274k -> +$4,000/yr
    # Tier 3: > $342k -> +$6,400/yr
    # Tier 4: > $410k -> +$8,800/yr
    if agi <= tier_1_limit:
        return 0
    if agi <= 274000:
        return 1600
    if agi <= 342000:
        return 4000
    if agi <= 410000:
        return 6400
    return 8800


def withdraw_from_specific_accounts(amount_needed, accounts, account_type, owner_age_map):
    """
    Withdraws money and returns (amount_withdrawn, average_basis_ratio)
    """
    if amount_needed <= 0:
        return 0.0, 0.0
    remaining_need = amount_needed
    total_withdrawn = 0.0
    weighted_basis_accum = 0.0

    for acc in accounts:
        if remaining_need <= 1.0:
            break  # Float tolerance
        if acc["type"] != account_type:
            continue

        owner = acc["owner"]
        current_age = owner_age_map.get(owner, 0)
        required_age = acc.get("available_at_age", 0)
        if current_age < required_age:
            continue

        withdrawal = min(acc["balance"], remaining_need)
        acc["balance"] -= withdrawal
        remaining_need -= withdrawal
        total_withdrawn += withdrawal

        basis = acc.get("cost_basis_ratio", 0.0)
        weighted_basis_accum += withdrawal * basis

    avg_basis = (weighted_basis_accum / total_withdrawn) if total_withdrawn > 0 else 0.0
    return total_withdrawn, avg_basis


def deposit_into_roth(amount_net, accounts, owner="primary"):
    for acc in accounts:
        if acc["type"] == "roth" and acc["owner"] == owner:
            acc["balance"] += amount_net
            return
    accounts.append(
        {"name": f"{owner} Roth (New)", "balance": amount_net, "type": "roth", "owner": owner}
    )


def apply_growth(accounts, rate):
    total = 0.0
    for acc in accounts:
        acc["balance"] *= 1 + rate
        total += acc["balance"]
    return total


# --- Simulation Orchestrator ---


def run_simulation(config_path="input.json"):
    with open(config_path, "r") as f:
        data = json.load(f)

    cfg = data["config"]
    accounts = copy.deepcopy(data["accounts"])

    projection = []
    current_spend_net = cfg["annual_spend_net"]

    irmaa_limit = cfg["irmaa_limit_tier_1"]

    for year in range(cfg["simulation_years"]):
        age_prim = cfg["current_age_primary"] + year
        age_spouse = cfg["current_age_spouse"] + year
        current_year = cfg["start_year"] + year
        age_map = {"primary": age_prim, "spouse": age_spouse, "joint": age_prim}

        if year > 0:
            current_spend_net *= 1 + cfg["inflation_rate"]

        # --- 1. Base Income (SS + RMDs) ---
        ss_income = 0.0
        if age_prim >= cfg["social_security"]["primary_start_age"]:
            ss_income += cfg["social_security"]["primary_benefit"]
        if age_spouse >= cfg["social_security"]["spouse_start_age"]:
            ss_income += cfg["social_security"]["spouse_benefit"]

        current_agi = ss_income * 0.85

        # Mandatory RMDs
        pretax_bal_prim = sum(
            a["balance"] for a in accounts if a["type"] == "pretax" and a["owner"] == "primary"
        )
        rmd_prim = calculate_rmd_amount(age_prim, pretax_bal_prim, cfg["rmd_start_age"])

        pretax_bal_spouse = sum(
            a["balance"] for a in accounts if a["type"] == "pretax" and a["owner"] == "spouse"
        )
        rmd_spouse = calculate_rmd_amount(age_spouse, pretax_bal_spouse, cfg["rmd_start_age"])

        total_rmd = rmd_prim + rmd_spouse
        rmd_withdrawn, _ = withdraw_from_specific_accounts(total_rmd, accounts, "pretax", age_map)
        current_agi += rmd_withdrawn

        # --- 2. Calculate Net Spend Needed ---
        est_tax_rate = (
            get_marginal_tax_rate(current_agi, cfg["tax_brackets_federal"]) + cfg["tax_rate_state"]
        )
        cash_in_hand = (ss_income * (1 - est_tax_rate)) + (rmd_withdrawn * (1 - est_tax_rate))
        remaining_spend_needed = max(0, current_spend_net - cash_in_hand)

        # Trackers
        brokerage_withdrawn = 0.0
        roth_withdrawn = 0.0
        voluntary_pretax = 0.0
        converted_amount = 0.0
        conversion_tax_paid = 0.0

        # --- 3. Spending Phase (Smart Brokerage vs Roth) ---
        if remaining_spend_needed > 0:
            # Check AGI Headroom before touching Brokerage
            agi_headroom = max(0, irmaa_limit - current_agi)

            # Theoretical Brokerage Draw needed
            # We must solve for X where X adds (X * (1-Basis)) to AGI
            # Simpler approach: Iterate or assume average basis
            # If we take $1 from Brokerage with 0.25 basis, we add $0.75 to AGI.

            # Max Safe Brokerage Draw = Headroom / (1 - Basis)
            # Find generic basis for estimation
            avg_basis = 0.25
            for acc in accounts:
                if acc["type"] == "brokerage":
                    avg_basis = acc.get("cost_basis_ratio", 0.25)

            max_safe_brokerage = agi_headroom / (1 - avg_basis) if avg_basis < 1 else 9999999

            # Amount we take from Brokerage is limited by the "Safe" amount
            amount_from_brokerage = min(remaining_spend_needed, max_safe_brokerage)

            if amount_from_brokerage > 0:
                real_withdrawn, real_basis = withdraw_from_specific_accounts(
                    amount_from_brokerage, accounts, "brokerage", age_map
                )
                brokerage_withdrawn += real_withdrawn
                current_agi += real_withdrawn * (1 - real_basis)
                remaining_spend_needed -= real_withdrawn

            # If we still need money, it implies Brokerage would have pushed us over IRMAA.
            # SWITCH TO ROTH.
            if remaining_spend_needed > 1.0:
                withdrawn, _ = withdraw_from_specific_accounts(
                    remaining_spend_needed, accounts, "roth", age_map
                )
                roth_withdrawn += withdrawn
                remaining_spend_needed -= withdrawn

            # If Roth is empty, last resort is Pretax (will trigger IRMAA)
            if remaining_spend_needed > 1.0:
                gross_need = remaining_spend_needed / (1 - est_tax_rate)
                withdrawn, _ = withdraw_from_specific_accounts(
                    gross_need, accounts, "pretax", age_map
                )
                voluntary_pretax += withdrawn
                current_agi += withdrawn
                remaining_spend_needed = 0

        # --- 4. Conversion Phase (Fill the Bucket) ---
        # Only convert if we are young (pre-RMD) AND have headroom
        if age_prim < cfg["rmd_start_age"]:
            agi_headroom = max(0, irmaa_limit - current_agi)

            # Only convert if it's worth the effort (e.g. > $5k)
            if agi_headroom > 5000:
                available_pretax = sum(a["balance"] for a in accounts if a["type"] == "pretax")
                conversion_target = min(agi_headroom, available_pretax)

                if conversion_target > 0:
                    # Calculate Tax on Conversion
                    tax_bill = conversion_target * est_tax_rate
                    conversion_tax_paid = tax_bill  # Tracking for display

                    # Pay Tax from Brokerage (Standard Strategy to Maximize Roth)
                    # Note: Paying tax adds to AGI (Capital Gains), reducing headroom!
                    # We will simplify and just pay it, allowing a slight IRMAA overshoot or assuming we left buffer.

                    tax_cash, tax_basis = withdraw_from_specific_accounts(
                        tax_bill, accounts, "brokerage", age_map
                    )
                    brokerage_withdrawn += tax_cash
                    current_agi += tax_cash * (1 - tax_basis)

                    # Execute Conversion
                    actual_converted, _ = withdraw_from_specific_accounts(
                        conversion_target, accounts, "pretax", age_map
                    )

                    # If Brokerage ran out, net the tax
                    if tax_cash < tax_bill:
                        net_deposit = actual_converted - (tax_bill - tax_cash)
                    else:
                        net_deposit = actual_converted

                    deposit_into_roth(net_deposit, accounts, "primary")
                    converted_amount += actual_converted
                    current_agi += actual_converted

        # --- Finalize ---
        total_balance = apply_growth(accounts, cfg["investment_growth_rate"])
        irmaa_cost = calculate_irmaa_cost(current_agi, cfg["irmaa_limit_tier_1"])

        projection.append(
            {
                "Year": current_year,
                "Age": age_prim,
                "AGI": round(current_agi),
                "RMD": round(total_rmd),
                "Roth Conv": round(converted_amount),
                "Conv Tax": round(conversion_tax_paid),
                "Roth W/D": round(roth_withdrawn),
                "Brok W/D": round(brokerage_withdrawn),
                "IRMAA Cost": irmaa_cost,
                "Balance": round(total_balance),
            }
        )

    # Output
    pd.set_option("display.max_columns", None)
    pd.set_option("display.width", 1000)
    df = pd.DataFrame(projection)
    print(df.to_string(index=False))


if __name__ == "__main__":
    run_simulation()
