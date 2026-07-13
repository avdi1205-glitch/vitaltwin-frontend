export type AnalyticsEventName =
  | 'open_modal'
  | 'register_submit'
  | 'login_success';

export function trackEvent(name: AnalyticsEventName, payload: Record<string, unknown> = {}): void {
  if (typeof window === 'undefined') {
    return;
  }

  const detail = {
    name,
    payload,
    ts: Date.now(),
  };

  // Keep it provider-agnostic: product can wire this to any analytics backend later.
  window.dispatchEvent(new CustomEvent('vitaltwin:analytics', { detail }));
}
