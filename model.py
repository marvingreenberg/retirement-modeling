#!/usr/bin/env python3
import json
import pandas as pd
import copy

# --- Helper Functions ---

def calculate_rmd_amount(age, balance, rmd_start_age):
    if age < rmd_start_age: return 0.0
    # Approx Uniform Lifetime Table
    divisor = max(27.4 - (age - 72), 5.0)
    return balance / divisor

def get_marginal_tax_rate(income, brackets):
    for bracket in brackets:
        if income < bracket['limit']: return bracket['rate']
    return brackets[-1]['rate']

def get_bracket_label(income):
    if income > 487450: return "35%+"
    if income > 383900: return "32%"
    if income > 201050: return "24%"
    if income > 94300: return "22%"
    return "12%"

def calculate_irmaa_cost(agi):
    # Simplified 2026 Tiers (Married Filing Jointly)
    if agi <= 218000: return 0
    if agi <= 274000: return 1600 # Tier 2
    if agi <= 342000: return 4000 # Tier 3
    if agi <= 410000: return 6400 # Tier 4
    return 8800 # Tier 5

def withdraw_from_specific_accounts(amount_needed, accounts, account_type, owner_age_map):
    """
    Withdraws money and returns (amount_withdrawn, average_basis_ratio)
    """
    if amount_needed <= 0: return 0.0, 0.0
    remaining_need = amount_needed
    total_withdrawn = 0.0
    weighted_basis_accum = 0.0

    for acc in accounts:
        if remaining_need <= 1.0: break
        if acc['type'] != account_type: continue

        owner = acc['owner']
        current_age = owner_age_map.get(owner, 0)
        required_age = acc.get('available_at_age', 0)
        if current_age < required_age: continue

        withdrawal = min(acc['balance'], remaining_need)
        acc['balance'] -= withdrawal
        remaining_need -= withdrawal
        total_withdrawn += withdrawal

        basis = acc.get('cost_basis_ratio', 0.0)
        weighted_basis_accum += (withdrawal * basis)

    avg_basis = (weighted_basis_accum / total_withdrawn) if total_withdrawn > 0 else 0.0
    return total_withdrawn, avg_basis

def deposit_into_account(amount, accounts, account_type, owner='joint'):
    for acc in accounts:
        if acc['type'] == account_type and acc['owner'] == owner:
            acc['balance'] += amount
            return
    # Fallback
    accounts.append({'name': f'New {account_type}', 'balance': amount, 'type': account_type, 'owner': owner, 'cost_basis_ratio': 1.0})

def apply_growth(accounts, rate):
    total = 0.0
    for acc in accounts:
        acc['balance'] *= (1 + rate)
        total += acc['balance']
    return total

# --- Simulation Orchestrator ---

def run_simulation(config_path='input.json'):
    try:
        with open(config_path, 'r') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"Error: Could not find {config_path}. Please create the input file.")
        return

    cfg = data['config']
    accounts = copy.deepcopy(data['accounts'])

    projection = []
    current_spend_net = cfg['annual_spend_net']

    # --- STRATEGY SELECTION ---
    strategy_target = cfg.get('strategy_target', 'irmaa_tier_1')

    # Define AGI Ceilings based on strategy
    if strategy_target == '24_percent_bracket':
        conversion_ceiling = 383900
        print(f"Strategy: Filling to Top of 24% Bracket (~${conversion_ceiling})")
    if strategy_target == '22_percent_bracket':
        conversion_ceiling = 201000
        print(f"Strategy: Filling to Top of 22% Bracket (~${conversion_ceiling})")
    elif strategy_target == 'irmaa_tier_1':
        conversion_ceiling = cfg['irmaa_limit_tier_1']
        print(f"Strategy: Capping at IRMAA Tier 1 (~${conversion_ceiling})")
    else:
        conversion_ceiling = 0 # Standard Spend Only
        print("Strategy: Standard Spending (No voluntary conversions)")

    print("-" * 60)

    for year in range(cfg['simulation_years']):
        age_prim = cfg['current_age_primary'] + year
        age_spouse = cfg['current_age_spouse'] + year
        current_year = cfg['start_year'] + year
        age_map = {'primary': age_prim, 'spouse': age_spouse, 'joint': age_prim}

        if year > 0: current_spend_net *= (1 + cfg['inflation_rate'])

        # --- 1. Base Income (SS + RMDs) ---
        ss_income = 0.0
        if age_prim >= cfg['social_security']['primary_start_age']:
            ss_income += cfg['social_security']['primary_benefit']
        if age_spouse >= cfg['social_security']['spouse_start_age']:
            ss_income += cfg['social_security']['spouse_benefit']

        current_agi = ss_income * 0.85

        # Mandatory RMDs
        pretax_bal_prim = sum(a['balance'] for a in accounts if a['type'] == 'pretax' and a['owner'] == 'primary')
        rmd_prim = calculate_rmd_amount(age_prim, pretax_bal_prim, cfg['rmd_start_age'])

        pretax_bal_spouse = sum(a['balance'] for a in accounts if a['type'] == 'pretax' and a['owner'] == 'spouse')
        rmd_spouse = calculate_rmd_amount(age_spouse, pretax_bal_spouse, cfg['rmd_start_age'])

        total_rmd = rmd_prim + rmd_spouse
        rmd_withdrawn, _ = withdraw_from_specific_accounts(total_rmd, accounts, 'pretax', age_map)
        current_agi += rmd_withdrawn

        # --- 2. Calculate Cash & Needs ---
        # Estimate Tax Rate for Withholding
        est_income_tax_rate = get_marginal_tax_rate(current_agi, cfg['tax_brackets_federal']) + cfg['tax_rate_state']

        # Cash in hand from SS and RMD (Net of Tax)
        cash_in_hand = (ss_income * (1 - est_income_tax_rate)) + (rmd_withdrawn * (1 - est_income_tax_rate))

        remaining_spend_needed = max(0, current_spend_net - cash_in_hand)
        surplus_cash = max(0, cash_in_hand - current_spend_net)

        # Trackers
        brokerage_withdrawn = 0.0
        roth_withdrawn = 0.0
        voluntary_pretax = 0.0
        converted_amount = 0.0
        conversion_tax_paid = 0.0
        brokerage_gains_tax_paid = 0.0

        # --- 3. Spending Logic ---
        if remaining_spend_needed > 0:
            # Check headroom
            agi_headroom = max(0, conversion_ceiling - current_agi)

            # Safe Brokerage Draw (generic approx for 0.25 basis)
            # If standard strategy (ceiling=0), we just draw what we need regardless of AGI
            if conversion_ceiling == 0:
                max_safe_brokerage = remaining_spend_needed
            else:
                max_safe_brokerage = agi_headroom / 0.75 if agi_headroom > 0 else 0

            amount_from_brokerage = min(remaining_spend_needed, max_safe_brokerage)

            if amount_from_brokerage > 0:
                real_withdrawn, real_basis = withdraw_from_specific_accounts(amount_from_brokerage, accounts, 'brokerage', age_map)
                brokerage_withdrawn += real_withdrawn

                # Update AGI (Gains Only)
                gains = real_withdrawn * (1 - real_basis)
                current_agi += gains

                # Estimate Cap Gains Tax
                brokerage_gains_tax_paid += gains * cfg['tax_rate_capital_gains']

                remaining_spend_needed -= real_withdrawn

            # If still needed, use Roth (doesn't hurt AGI)
            if remaining_spend_needed > 1.0:
                withdrawn, _ = withdraw_from_specific_accounts(remaining_spend_needed, accounts, 'roth', age_map)
                roth_withdrawn += withdrawn
                remaining_spend_needed -= withdrawn

            # If Roth empty, use Pretax (Last Resort - hurts AGI)
            if remaining_spend_needed > 1.0:
                 gross_need = remaining_spend_needed / (1 - est_income_tax_rate)
                 withdrawn, _ = withdraw_from_specific_accounts(gross_need, accounts, 'pretax', age_map)
                 voluntary_pretax += withdrawn
                 current_agi += withdrawn
                 remaining_spend_needed = 0

        # --- 4. Conversion Logic (Fill the Bucket) ---
        # Only if enabled (ceiling > 0) and Pre-RMD age
        if conversion_ceiling > 0 and age_prim < cfg['rmd_start_age']:
            agi_headroom = max(0, conversion_ceiling - current_agi)

            if agi_headroom > 5000:
                available_pretax = sum(a['balance'] for a in accounts if a['type'] == 'pretax')
                conversion_target = min(agi_headroom, available_pretax)

                if conversion_target > 0:
                    # Calculate Tax Bill
                    tax_bill = conversion_target * est_income_tax_rate
                    conversion_tax_paid = tax_bill

                    # Pay tax from Brokerage
                    tax_cash, tax_basis = withdraw_from_specific_accounts(tax_bill, accounts, 'brokerage', age_map)
                    brokerage_withdrawn += tax_cash

                    # AGI impact of paying the tax (gain portion)
                    tax_payment_gain = tax_cash * (1 - tax_basis)
                    current_agi += tax_payment_gain
                    brokerage_gains_tax_paid += tax_payment_gain * cfg['tax_rate_capital_gains']

                    # Execute Conversion
                    actual_converted, _ = withdraw_from_specific_accounts(conversion_target, accounts, 'pretax', age_map)

                    # If Brokerage ran out, net the tax
                    if tax_cash < tax_bill:
                        net_deposit = actual_converted - (tax_bill - tax_cash)
                    else:
                        net_deposit = actual_converted

                    deposit_into_account(net_deposit, accounts, 'roth', 'primary')
                    converted_amount += actual_converted
                    current_agi += actual_converted

        # --- 5. Reinvest Surplus ---
        if surplus_cash > 0:
            deposit_into_account(surplus_cash, accounts, 'brokerage', 'joint')

        # --- 6. Total Tax Calculation ---
        # Income Tax Estimate
        taxable_income_approx = max(0, current_agi - 30000) # Standard Deduction approx
        income_tax_total = taxable_income_approx * est_income_tax_rate

        # IRMAA
        irmaa_cost = calculate_irmaa_cost(current_agi)

        total_tax_liability = income_tax_total + brokerage_gains_tax_paid + irmaa_cost

        # --- Finalize ---
        total_balance = apply_growth(accounts, cfg['investment_growth_rate'])

        projection.append({
            "Age": age_prim,
            "AGI": round(current_agi),
            "Bracket": get_bracket_label(current_agi),
            "RMD": round(total_rmd),
            "Surplus": round(surplus_cash),
            "Roth Conv": round(converted_amount),
            "Conv Tax": round(conversion_tax_paid),
            "PreTax WD": round(voluntary_pretax),
            "Roth WD": round(roth_withdrawn),
            "Brok WD": round(brokerage_withdrawn),
            "Total Tax": round(total_tax_liability),
            "IRMAA": irmaa_cost,
            "Balance": round(total_balance)
        })

    # Output
    pd.set_option('display.max_columns', None)
    pd.set_option('display.width', 1000)
    df = pd.DataFrame(projection)

    # Reorder columns for readability
    cols = ["Age", "AGI", "Bracket", "RMD", "Surplus", "Roth Conv", "Conv Tax", "PreTax WD", "Roth WD", "Brok WD", "Total Tax", "IRMAA", "Balance"]
    print(df[cols].to_string(index=False))

if __name__ == "__main__":
    run_simulation()
