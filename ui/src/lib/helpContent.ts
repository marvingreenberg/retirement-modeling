export interface HelpTopic {
   id: string;
   title: string;
   content: string;
   relatedTopics: string[];
}

export const helpTopics: HelpTopic[] = [
   {
      id: 'tax-indexing',
      title: 'Tax Bracket Inflation Indexing',
      relatedTopics: ['spending-strategies'],
      content: `
<p>The IRS annually adjusts federal tax brackets, the standard deduction, IRMAA thresholds, and capital gains brackets using <strong>Chained CPI-U</strong> (C-CPI-U), a measure of consumer inflation. This keeps bracket thresholds roughly in line with rising prices so that inflation alone doesn't push people into higher brackets ("bracket creep").</p>
<p>The simulation applies this indexing using the configured inflation rate as a proxy for Chained CPI-U. The difference between general CPI and Chained CPI-U is typically ~0.2–0.3% per year — small enough that the proxy is reasonable for planning purposes.</p>
<p>The alternative — using fixed 2024-dollar brackets for a 30-year simulation — dramatically overstates tax liability in later years and biases withdrawal strategies toward being overly conservative.</p>
<p class="text-surface-500 text-xs mt-3">Note: Legislative changes to tax policy (like TCJA in 2017) are a separate concern handled by tax regime sampling in Monte Carlo simulations, not by inflation indexing.</p>`,
   },
   {
      id: 'spending-strategies',
      title: 'Spending Strategies',
      relatedTopics: ['tax-indexing', 'ss-benefit'],
      content: `
<h4 class="font-semibold mt-0">Fixed Dollar</h4>
<p>Uses a configured annual spending amount, adjusted for inflation each year. This is the only strategy where "desired income" directly controls spending.</p>

<h4 class="font-semibold">Percent of Portfolio (4% Rule)</h4>
<p>Withdraws a fixed percentage of current portfolio value each year. Spending rises and falls with the portfolio — there is no target income. The default rate is 4%, based on the widely-cited Trinity Study finding that a 4% initial withdrawal rate historically survived 30-year periods.</p>

<h4 class="font-semibold">Guardrails (Guyton-Klinger)</h4>
<p>Starts with an initial withdrawal rate applied to the portfolio balance, then adjusts spending up or down when the current withdrawal rate drifts beyond configurable floor/ceiling bands (default ±20% of the initial rate). Adjustments are ±10% of current spending. This provides more stability than pure percent-of-portfolio while still responding to market conditions.</p>

<h4 class="font-semibold">RMD-Based</h4>
<p>Withdraws based on IRS Required Minimum Distribution divisor tables, applied to the full portfolio (not just pre-tax accounts). Before age 72, uses a conservative 1/30 rate (~3.3%). After 72, uses the IRS Uniform Lifetime Table divisors which increase the withdrawal rate with age. You mathematically cannot outlive your money with this strategy, but income varies significantly.</p>`,
   },
   {
      id: 'ss-benefit',
      title: 'Social Security Benefit Formula',
      relatedTopics: ['income-cola', 'spending-strategies'],
      content: `
<p>The simulation computes SS benefits using the actual actuarial adjustment formula:</p>
<ul class="list-disc list-inside space-y-2 my-3">
<li><strong>Early claiming (before FRA):</strong> Benefit is reduced by 5/9 of 1% per month for the first 36 months early, and 5/12 of 1% per month beyond 36 months. Claiming at 62 (with FRA 67) reduces the benefit to about 70% of the FRA amount.</li>
<li><strong>Delayed claiming (after FRA):</strong> Benefit increases by 2/3 of 1% per month (8% per year) for each month delayed past FRA, up to age 70. Claiming at 70 increases the benefit to about 124% of the FRA amount.</li>
<li><strong>Taxability:</strong> The simulation applies 85% taxability to SS income, which is the rate for most retirees with significant other income. The actual IRS rules have 0%/50%/85% tiers based on combined income.</li>
</ul>`,
   },
   {
      id: 'income-cola',
      title: 'Income Stream COLA',
      relatedTopics: ['ss-benefit', 'tax-indexing'],
      content: `
<p>Income streams (pensions, annuities, etc.) can have a per-stream cost-of-living adjustment (COLA) rate.</p>
<p>The effective amount in any year is:</p>
<p class="font-mono text-sm bg-surface-200 dark:bg-surface-700 rounded px-3 py-2 my-3">base_amount × (1 + cola_rate) ^ years_active</p>
<p>where <code class="text-sm">years_active</code> is the number of years since the stream started. Year 0 (the start age) uses the base amount with no adjustment.</p>`,
   },
];

export const routeTopicMap: Record<string, string> = {
   '/': 'spending-strategies',
   '/compare': 'spending-strategies',
   '/details': 'tax-indexing',
};

export function getTopicById(id: string): HelpTopic | undefined {
   return helpTopics.find((t) => t.id === id);
}

export function getDefaultTopicId(pathname: string): string {
   return routeTopicMap[pathname] ?? 'spending-strategies';
}
