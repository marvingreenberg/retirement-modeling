import { type ZodError } from 'zod';
import { portfolioSchema } from './schema';
import type { Portfolio } from './types';

export type FieldErrors = Record<string, string>;

export function validatePortfolio(portfolio: Portfolio): FieldErrors {
	const result = portfolioSchema.safeParse(portfolio);
	if (result.success) return {};

	const errors: FieldErrors = {};
	for (const issue of result.error.issues) {
		const path = issue.path.join('.');
		errors[path] = issue.message;
	}
	return errors;
}

export function getFieldError(errors: FieldErrors, path: string): string | undefined {
	return errors[path];
}
