import type { SimulationConfig, ChartEvent, ChartEventKind } from '$lib/types';

function formatAmount(amount: number): string {
   return amount >= 1000
      ? `$${Math.round(amount / 1000)}K`
      : `$${Math.round(amount)}`;
}

export function buildChartEvents(
   config: SimulationConfig,
   primaryName = '',
   spouseName = '',
): ChartEvent[] {
   const events: ChartEvent[] = [];
   const agePrimary = config.current_age_primary;
   const ageSpouse = config.current_age_spouse;

   for (const stream of config.income_streams) {
      const isSpouse = stream.owner === 'spouse';
      const ownerAge = isSpouse ? ageSpouse : agePrimary;
      const ownerName = isSpouse ? spouseName : primaryName;
      const startYear = config.start_year + (stream.start_age - ownerAge);
      const amt = formatAmount(stream.amount);
      const ageLine = `Age ${stream.start_age}`;
      const ownerPrefix = ownerName
         ? `${ageLine} - ${ownerName}\n`
         : `${ageLine}\n`;
      events.push({
         year: startYear,
         label: `${stream.name} ${amt}`,
         tooltip: `${ownerPrefix}${amt} ${stream.name} Start`,
         type: 'start',
         kind: `income_${stream.kind}` as ChartEventKind,
      });
      if (stream.end_age != null) {
         const endYear = config.start_year + (stream.end_age - ownerAge);
         const endAgeLine = `Age ${stream.end_age}`;
         const endOwnerPrefix = ownerName
            ? `${endAgeLine} - ${ownerName}\n`
            : `${endAgeLine}\n`;
         events.push({
            year: endYear,
            label: `${stream.name} ends`,
            tooltip: `${endOwnerPrefix}${stream.name} Ends`,
            type: 'end',
            kind: 'income_end',
         });
      }
   }

   for (const expense of config.planned_expenses) {
      const amt = formatAmount(expense.amount);
      if (expense.expense_type === 'one_time' && expense.year) {
         events.push({
            year: expense.year,
            label: `${expense.name} ${amt}`,
            tooltip: `${expense.name} ${amt} (one-time)`,
            type: 'start',
            kind: 'expense_one_time',
         });
      } else if (expense.expense_type === 'recurring' && expense.start_year) {
         const yearRange = expense.end_year
            ? `${expense.start_year}-${expense.end_year}`
            : `${expense.start_year}+`;
         events.push({
            year: expense.start_year,
            label: `${expense.name} ${amt}`,
            tooltip: `${expense.name} ${amt}/yr\n${yearRange} begins`,
            type: 'start',
            kind: 'expense_recurring',
         });
         if (expense.end_year) {
            events.push({
               year: expense.end_year,
               label: `${expense.name} ends`,
               tooltip: `${expense.name} ends`,
               type: 'end',
               kind: 'expense_recurring_end',
            });
         }
      }
   }

   events.sort((a, b) => a.year - b.year);
   return events;
}
