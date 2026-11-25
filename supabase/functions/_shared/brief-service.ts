import { buildMorningBrief, MOCK_MORNING_BRIEF } from './morning-brief.ts';
import { runGuardedCall, type LiveProvider, type UsageStore } from './usage.ts';

/** Call only after authentication. No schedule mutation is performed here. */
export async function generateMorningBrief(options: {
  authenticatedUserId: string;
  context: unknown;
  store: UsageStore;
  mode?: 'mock' | 'live';
  provider?: LiveProvider;
}) {
  const context = buildMorningBrief(options.context, options.authenticatedUserId);
  const brief = await runGuardedCall({
    call: { userId: options.authenticatedUserId, feature: 'brief', mode: options.mode ?? 'mock' },
    ...context,
    mockOutput: MOCK_MORNING_BRIEF,
    store: options.store,
    provider: options.provider,
  });
  return { aiGenerated: true as const, mode: options.mode ?? 'mock', brief };
}
