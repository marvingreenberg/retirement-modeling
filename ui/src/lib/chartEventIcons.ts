import type { ChartEventKind } from '$lib/types';
import {
   Briefcase,
   Landmark,
   Building2,
   Home,
   Scale,
   CircleDollarSign,
   CircleX,
   Receipt,
   Repeat,
} from 'lucide-svelte';

export interface EventIconConfig {
   icon: typeof Briefcase;
   color: string;
   bg: string;
}

export const EVENT_ICON_MAP: Record<ChartEventKind, EventIconConfig> = {
   income_employment: { icon: Briefcase, color: '#16a34a', bg: '#dcfce7' },
   income_pension: { icon: Landmark, color: '#2563eb', bg: '#dbeafe' },
   income_ss: { icon: Building2, color: '#7c3aed', bg: '#ede9fe' },
   income_rental: { icon: Home, color: '#0891b2', bg: '#cffafe' },
   income_alimony: { icon: Scale, color: '#d97706', bg: '#fef3c7' },
   income_other: { icon: CircleDollarSign, color: '#16a34a', bg: '#dcfce7' },
   income_end: { icon: CircleX, color: '#dc2626', bg: '#fee2e2' },
   expense_one_time: { icon: Receipt, color: '#ea580c', bg: '#ffedd5' },
   expense_recurring: { icon: Repeat, color: '#ea580c', bg: '#ffedd5' },
   expense_recurring_end: { icon: CircleX, color: '#ea580c', bg: '#ffedd5' },
};
