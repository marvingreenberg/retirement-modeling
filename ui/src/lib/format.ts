export function currency(value: number): string {
	return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

export function pct(value: number): string {
	return (value * 100).toFixed(1) + '%';
}
