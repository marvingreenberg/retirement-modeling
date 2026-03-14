export interface HelpTopicMeta {
   id: string;
   name: string;
   related: string[];
}

export interface HelpCategory {
   id: string;
   name: string;
   topics: HelpTopicMeta[];
}

export const helpCategories: HelpCategory[] = [
   {
      id: 'app-basics',
      name: 'App Basics',
      topics: [
         {
            id: 'getting-started',
            name: 'Getting Started',
            related: ['spending-strategies', 'balance-chart'],
         },
         { id: 'about', name: 'About', related: [] },
      ],
   },
   {
      id: 'your-inputs',
      name: 'Your Inputs',
      topics: [
         {
            id: 'accounts-tax-treatment',
            name: 'Accounts & Tax Treatment',
            related: ['withdrawal-order', 'tax-bracket-indexing'],
         },
         {
            id: 'income-cola',
            name: 'Income & COLA',
            related: ['social-security', 'tax-bracket-indexing'],
         },
         {
            id: 'social-security',
            name: 'Social Security',
            related: ['income-cola', 'spending-strategies'],
         },
         {
            id: 'pre-retirement',
            name: 'Pre-Retirement Modeling',
            related: ['income-cola', 'roth-conversions', 'withdrawal-order'],
         },
         {
            id: 'planned-expenses',
            name: 'Planned Expenses',
            related: ['spending-strategies', 'spending-chart'],
         },
      ],
   },
   {
      id: 'rules-strategies',
      name: 'Rules & Strategies',
      topics: [
         {
            id: 'spending-strategies',
            name: 'Spending Strategies',
            related: ['withdrawal-order', 'simulation-parameters'],
         },
         {
            id: 'withdrawal-order',
            name: 'Withdrawal Order',
            related: ['accounts-tax-treatment', 'spending-strategies'],
         },
         {
            id: 'roth-conversions',
            name: 'Roth Conversions',
            related: ['tax-bracket-indexing', 'accounts-tax-treatment'],
         },
         {
            id: 'required-minimum-distributions',
            name: 'Required Minimum Distributions',
            related: ['accounts-tax-treatment', 'withdrawal-order'],
         },
         {
            id: 'simulation-parameters',
            name: 'Simulation Parameters',
            related: ['spending-strategies', 'monte-carlo'],
         },
         {
            id: 'tax-bracket-indexing',
            name: 'Tax Bracket Indexing',
            related: ['roth-conversions', 'spending-strategies'],
         },
      ],
   },
   {
      id: 'understanding-results',
      name: 'Understanding Results',
      topics: [
         {
            id: 'balance-chart',
            name: 'Balance Chart',
            related: ['spending-chart', 'accounts-tax-treatment'],
         },
         {
            id: 'spending-chart',
            name: 'Spending Chart',
            related: ['balance-chart', 'spending-strategies'],
         },
         {
            id: 'monte-carlo',
            name: 'Monte Carlo Simulation',
            related: ['outcome-distribution', 'simulation-parameters'],
         },
         {
            id: 'outcome-distribution',
            name: 'Outcome Distribution',
            related: ['monte-carlo', 'spending-strategies'],
         },
         {
            id: 'details-page',
            name: 'Details View',
            related: ['balance-chart', 'spending-chart'],
         },
         {
            id: 'compare-page',
            name: 'Compare View',
            related: ['details-page', 'monte-carlo'],
         },
         {
            id: 'present-value',
            name: 'Present Value (PV $)',
            related: ['details-page', 'compare-page'],
         },
      ],
   },
];

export const allTopicIds: string[] = helpCategories.flatMap((c) =>
   c.topics.map((t) => t.id),
);

const topicIndex = new Map<string, HelpTopicMeta>(
   helpCategories.flatMap((c) => c.topics.map((t) => [t.id, t] as const)),
);

const categoryIndex = new Map<string, HelpCategory>(
   helpCategories.flatMap((c) => c.topics.map((t) => [t.id, c] as const)),
);

export function getTopicMeta(id: string): HelpTopicMeta | undefined {
   return topicIndex.get(id);
}

export function getCategoryForTopic(id: string): HelpCategory | undefined {
   return categoryIndex.get(id);
}

const routeTopicMap: Record<string, string> = {
   '/': 'getting-started',
   '/spending': 'spending-strategies',
   '/compare': 'compare-page',
   '/details': 'details-page',
};

export function getDefaultTopicId(pathname: string): string {
   return routeTopicMap[pathname] ?? 'getting-started';
}
