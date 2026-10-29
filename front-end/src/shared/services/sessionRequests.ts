let generation = 0;
const controllers = new Set<AbortController>();
let onExpired: (() => void) | undefined;

export const sessionRequests = {
  generation: () => generation,
  assertCurrent: (expected: number) => {
    if (expected !== generation) throw new Error('Sessão alterada');
  },
  track: (controller: AbortController) => controllers.add(controller),
  release: (controller?: AbortController) => {
    if (controller) controllers.delete(controller);
  },
  onExpired: (callback: () => void) => {
    onExpired = callback;
  },
  expire: () => onExpired?.(),
  cancel: () => {
    generation += 1;
    for (const controller of controllers) controller.abort();
    controllers.clear();
  },
};
