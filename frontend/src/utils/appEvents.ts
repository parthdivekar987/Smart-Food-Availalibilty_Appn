/**
 * Tiny app-wide UI event bus (decouples global components like notifications from page state).
 */
export const APP_EVENTS = {
  OPEN_CART: 'app:open-cart',
  ORDER_UPDATED: 'app:order-updated',
} as const;

export const emitAppEvent = (name: (typeof APP_EVENTS)[keyof typeof APP_EVENTS], detail?: unknown) =>
  window.dispatchEvent(new CustomEvent(name, { detail }));

export const onAppEvent = (name: (typeof APP_EVENTS)[keyof typeof APP_EVENTS], fn: (detail: any) => void) => {
  const handler = (e: Event) => fn((e as CustomEvent).detail);
  window.addEventListener(name, handler);
  return () => window.removeEventListener(name, handler);
};
