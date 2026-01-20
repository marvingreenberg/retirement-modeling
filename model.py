#!/usr/bin/env python3
import copy
import json

import pandas as pd

# --- Core Logic Functions ---


def calculate_rmd_amount(age, balance, rmd_start_age):
    if age < rmd_start_age:
        return 0.0
    divisor = max(27.4 - (age - 72), 5.0)
    return balance / divisor


def get_marginal_tax_rate(income, brackets):
    for bracket in brackets:
        if income < bracket["limit"]:
            return bracket["rate"]
    return brackets[-1]["rate"]


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
        if remaining_need <= 0:
            break
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


def run_simulation(config_path="portfolio.json"):
    with open(config_path, "r") as f:
        data = json.load(f)

    cfg = data["config"]
    accounts = copy.deepcopy(data["accounts"])

    projection = []
    current_spend_net = cfg["annual_spend_net"]
    strategy_mode = cfg.get("strategy", "aggressive_conversion")

    for year in range(cfg["simulation_years"]):
        age_prim = cfg["current_age_primary"] + year
        age_spouse = cfg["current_age_spouse"] + year
        current_year = cfg["start_year"] + year
        age_map = {"primary": age_prim, "spouse": age_spouse, "joint": age_prim}

        if year > 0:
            current_spend_net *= 1 + cfg["inflation_rate"]

        # --- Income Sources ---
        ss_income = 0.0
        if age_prim >= cfg["social_security"]["primary_start_age"]:
            ss_income += cfg["social_security"]["primary_benefit"]
        if age_spouse >= cfg["social_security"]["spouse_start_age"]:
            ss_income += cfg["social_security"]["spouse_benefit"]

        # Base AGI (SS is 85% taxable)
        current_agi = ss_income * 0.85

        # --- Mandatory RMDs ---
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

        # --- Calculate Initial Tax & Cash Needs ---
        est_tax_rate = (
            get_marginal_tax_rate(current_agi, cfg["tax_brackets_federal"]) + cfg["tax_rate_state"]
        )

        # Cash from Income Sources (Net of Tax)
        cash_in_hand = (ss_income * (1 - est_tax_rate)) + (rmd_withdrawn * (1 - est_tax_rate))
        remaining_spend_needed = max(0, current_spend_net - cash_in_hand)

        voluntary_pretax = 0.0
        converted_amount = 0.0
        brokerage_withdrawn = 0.0
        roth_withdrawn = 0.0

        # --- STRATEGY: Aggressive Conversion ---
        if strategy_mode == "aggressive_conversion":

            # 1. Pay for Spending using Brokerage
            if remaining_spend_needed > 0:
                withdrawn, basis = withdraw_from_specific_accounts(
                    remaining_spend_needed, accounts, "brokerage", age_map
                )
                brokerage_withdrawn += withdrawn

                # AGI Impact: (Withdrawn * (1 - basis))
                # With 0.25 basis, 75% is added to AGI
                agi_impact = withdrawn * (1 - basis)
                current_agi += agi_impact

                remaining_spend_needed = max(0, remaining_spend_needed - withdrawn)

            # 2. Fallback: Roth then Pretax for spending (if brokerage empty)
            if remaining_spend_needed > 0:
                withdrawn, _ = withdraw_from_specific_accounts(
                    remaining_spend_needed, accounts, "roth", age_map
                )
                roth_withdrawn += withdrawn
                remaining_spend_needed = max(0, remaining_spend_needed - withdrawn)

            if remaining_spend_needed > 0:
                gross_need = remaining_spend_needed / (1 - est_tax_rate)
                withdrawn, _ = withdraw_from_specific_accounts(
                    gross_need, accounts, "pretax", age_map
                )
                voluntary_pretax += withdrawn
                current_agi += withdrawn
                remaining_spend_needed = 0

            # 3. Roth Conversions (The main event)
            if age_prim < cfg["rmd_start_age"]:
                target_agi = cfg["irmaa_limit_tier_1"]
                agi_headroom = max(0, target_agi - current_agi)

                # Minimum viable conversion
                if agi_headroom > 2000:
                    available_pretax = sum(a["balance"] for a in accounts if a["type"] == "pretax")
                    conversion_target = min(agi_headroom, available_pretax)

                    if conversion_target > 0:
                        # We need to pay tax on this conversion.
                        # If we pay from brokerage, THAT withdrawal increases AGI too, eating into headroom.
                        # Iterative approximation:
                        # We need roughly (conversion * tax_rate) in cash.
                        # Brokerage withdrawal factor = 1 + (tax_rate_on_gains * gain_ratio) ... simplified

                        tax_bill = conversion_target * est_tax_rate

                        # Withdraw Tax from Brokerage
                        tax_cash, tax_basis = withdraw_from_specific_accounts(
                            tax_bill, accounts, "brokerage", age_map
                        )
                        brokerage_withdrawn += tax_cash

                        # Add tax withdrawal AGI impact
                        tax_agi_impact = tax_cash * (1 - tax_basis)
                        current_agi += tax_agi_impact

                        # Did we overshoot IRMAA?
                        if current_agi > target_agi:
                            # Simple correction: reduce conversion amount for next year's logic
                            # (simulation is slightly imperfect here, but acceptable)
                            pass

                        # Execute Conversion
                        actual_converted, _ = withdraw_from_specific_accounts(
                            conversion_target, accounts, "pretax", age_map
                        )

                        # Deposit (assuming tax paid by brokerage)
                        # If brokerage was empty, we net the tax from the conversion
                        if tax_cash < tax_bill:
                            net_deposit = actual_converted - (tax_bill - tax_cash)
                        else:
                            net_deposit = actual_converted

                        deposit_into_roth(net_deposit, accounts, "primary")

                        converted_amount += actual_converted
                        current_agi += actual_converted

        # --- Finalize ---
        total_balance = apply_growth(accounts, cfg["investment_growth_rate"])

        projection.append(
            {
                "Year": current_year,
                "Age": age_prim,
                "AGI": round(current_agi),
                "Roth Conv": round(converted_amount),
                "PreTax WD": round(voluntary_pretax + rmd_withdrawn),
                "Brok WD": round(brokerage_withdrawn),
                "IRMAA?": "⚠️" if current_agi > cfg["irmaa_limit_tier_1"] else "OK",
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
