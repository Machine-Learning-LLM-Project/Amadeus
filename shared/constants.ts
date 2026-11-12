/**
 * Project-wide limits. Changing any of these affects the budget; tell the team in the PR.
 * See docs/api-access.md and docs/team-plan.md.
 */

/** The only text model the course key allows. Calls to other models are rejected. */
export const ALLOWED_MODEL = 'gpt-6-luna';

/** App-side monthly block. The provider's hard limit is $10; we stop at $8. */
export const MONTHLY_SPEND_LIMIT_USD = 8;

/** Max attempts in the rank -> build -> check -> retry loop. */
export const MAX_LOOP_ATTEMPTS = 3;

/** Default cap on output tokens. Every model call must set a cap. */
export const DEFAULT_MAX_OUTPUT_TOKENS = 1500;

/**
 * USD per 1M tokens for ALLOWED_MODEL, taken from the proposal's cost estimate.
 * TODO(Bayasaa): verify against the course demo notebook / provider pricing.
 */
export const PRICE_PER_MILLION_TOKENS_USD = { input: 0.1, output: 0.5 } as const;
