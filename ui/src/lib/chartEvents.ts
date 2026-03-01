import type { SimulationConfig, ChartEvent, ChartEventKind } from '$lib/types';

function formatAmount(amount: number): string {
   return amount >= 1000
      ? `$${Math.round(amount / 1000)}K`
      : `$${Math.round(amount)}`;
}

export function buildChartEvents(config: SimulationConfig): ChartEvent[] {
   const events: ChartEvent[] = [];
   const agePrimary = config.current_age_primary;
   const ageSpouse = config.current_age_spouse;

   for (const stream of config.income_streams) {
      const ownerAge = stream.owner === 'spouse' ? ageSpouse : agePrimary;
      const startYear = config.start_year + (stream.start_age - ownerAge);
      const amt = formatAmount(stream.amount);
      events.push({
         year: startYear,
         label: `${stream.name} ${amt}`,
         tooltip: `${stream.name} ${amt}/yr begins`,
         type: 'start',
         kind: `income_${stream.kind}` as ChartEventKind,
      });
      if (stream.end_age != null) {
         const endYear = config.start_year + (stream.end_age - ownerAge);
         events.push({
            year: endYear,
            label: `${stream.name} ends`,
            tooltip: `${stream.name} ${amt}/yr ends`,
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
         events.push({
            year: expense.start_year,
            label: `${expense.name} ${amt}`,
            tooltip: `${expense.name} ${amt}/yr starts`,
            type: 'start',
            kind: 'expense_recurring',
         });
      }
   }

   events.sort((a, b) => a.year - b.year);
   return events;
}
