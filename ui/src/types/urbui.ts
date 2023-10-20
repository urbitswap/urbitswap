import { Location } from 'react-router-dom';

export type ReactRouterState = null | {
  backgroundLocation?: Location;
  thenTo?: string;
};

export interface ClassProps {
  className?: string;
}
