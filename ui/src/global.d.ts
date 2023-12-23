declare module 'urbit-ob' {
  function patp(ship: string | number): string;
  function clan(ship: string): 'galaxy' | 'star' | 'planet' | 'moon' | 'comet';
}
