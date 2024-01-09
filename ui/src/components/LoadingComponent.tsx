import React, { ReactNode, createElement } from 'react';
import type {
  DeferredRenderProps,
  DeferredPrecheckProps,
  DeferredPrecheckReport,
} from '@/types/utils';

export default function LoadingComponent<P extends {}, Q extends DeferredPrecheckProps>({
  checks,
  render,
  prerender = { render: (() => null) },
}: {
  checks: DeferredPrecheckReport[];
  render: DeferredRenderProps<null, P>;
  prerender?: DeferredRenderProps<null, Q>;
}) {
  const [currCheck, currIndex]: [DeferredPrecheckReport | undefined, number] = (() => {
    const index: number = checks.findIndex((check: DeferredPrecheckReport) => !check.status);
    return [(index === -1) ? undefined : checks[index], index];
  })();

  return !currCheck
    ? createElement(render.render, ((render?.props ?? {}) as P))
    : (currCheck.status === false)
      ? createElement(currCheck.render, {})
      : createElement(
        prerender.render,
        (Object.assign({}, prerender?.props ?? {}, {
          stage: currIndex + 1,
          total: checks.length,
        }) as Q)
      );
}
