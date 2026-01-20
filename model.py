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
    # Finds the first available Roth account for the owner and deposits cash
    for acc in accounts:
        if acc["type"] == "roth" and acc["owner"] == owner:
            acc["balance"] += amount_net
            return
    # Fallback: create one if missing (simplified)
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

        # --- Determine Cash Need ---
        est_tax_rate = (
            get_marginal_tax_rate(current_agi, cfg["tax_brackets_federal"]) + cfg["tax_rate_state"]
        )
        cash_in_hand = (ss_income * (1 - est_tax_rate)) + (rmd_withdrawn * (1 - est_tax_rate))
        remaining_spend_needed = max(0, current_spend_net - cash_in_hand)

        # --- Strategy: Fill Bucket (Spending + Conversions) ---
        target_agi = cfg["irmaa_limit_tier_1"]
        agi_headroom = max(0, target_agi - current_agi)

        voluntary_pretax = 0.0
        converted_amount = 0.0

        # 1. Take Pre-tax for Spending (Priority)
        if remaining_spend_needed > 0 and agi_headroom > 0:
            gross_need = remaining_spend_needed / (1 - est_tax_rate)
            amount = min(gross_need, agi_headroom)
            withdrawn, _ = withdraw_from_specific_accounts(amount, accounts, "pretax", age_map)
            voluntary_pretax += withdrawn
            current_agi += withdrawn
            agi_headroom -= withdrawn
            remaining_spend_needed = max(
                0, remaining_spend_needed - (withdrawn * (1 - est_tax_rate))
            )

        # 2. Roth Conversions (Optional Strategy)
        if cfg.get("do_roth_conversions", False) and agi_headroom > 1000 and total_rmd == 0:
            # Only convert if we have headroom AND we aren't already forced into RMDs
            # Convert the remaining headroom
            conversion_amt = min(
                agi_headroom, sum(a["balance"] for a in accounts if a["type"] == "pretax")
            )
            withdrawn, _ = withdraw_from_specific_accounts(
                conversion_amt, accounts, "pretax", age_map
            )

            # Pay tax on conversion from the conversion itself (simplified)
            # or pay from brokerage? Here we pay from conversion proceeds for simplicity.
            net_deposit = withdrawn * (1 - est_tax_rate)
            deposit_into_roth(net_deposit, accounts, "primary")

            converted_amount += withdrawn
            current_agi += withdrawn

        # --- Strategy: Brokerage & Roth for Shortfalls ---
        brokerage_withdrawn = 0.0
        if remaining_spend_needed > 0:
            withdrawn, basis = withdraw_from_specific_accounts(
                remaining_spend_needed, accounts, "brokerage", age_map
            )
            brokerage_withdrawn = withdrawn
            current_agi += withdrawn * (1 - basis)  # Only gain adds to AGI
            remaining_spend_needed = max(0, remaining_spend_needed - withdrawn)

        roth_withdrawn = 0.0
        if remaining_spend_needed > 0:
            withdrawn, _ = withdraw_from_specific_accounts(
                remaining_spend_needed, accounts, "roth", age_map
            )
            roth_withdrawn = withdrawn
            remaining_spend_needed = max(0, remaining_spend_needed - withdrawn)

        # --- Finalize ---
        total_balance = apply_growth(accounts, cfg["investment_growth_rate"])

        projection.append(
            {
                "Year": current_year,
                "Age": age_prim,
                "AGI": round(current_agi),
                "RMD": round(total_rmd),
                "Roth Conv": round(converted_amount),
                "PreTax W/D": round(rmd_withdrawn + voluntary_pretax),
                "Roth W/D": round(roth_withdrawn),
                "Brok W/D": round(brokerage_withdrawn),
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
