export type Args  = any[];
export type Callable = (...args: any[]) => any;

export interface DeferredPrecheckReport {
  render: React.ForwardRefRenderFunction<null, {}>;
  status: boolean | undefined;
}

export interface DeferredPrecheckProps {
  stage: number;
  total: number;
}

export interface DeferredRenderProps<T = null, P = {}> {
  render: React.ForwardRefRenderFunction<T, P>;
  props?: P;
}
