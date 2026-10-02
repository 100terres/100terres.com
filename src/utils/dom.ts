// It is important to use this function when manipulating DOM element, since we are shorting classes after the build.
export const $$$querySelector = Object.assign(
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
  <T extends Element = Element>(
    el: Element | Document,
    selector: string,
    // eslint-disable-next-line no-restricted-syntax
  ): T | null => el.querySelector<T>(selector),
  { __q: "$$$querySelector" } as const,
);
