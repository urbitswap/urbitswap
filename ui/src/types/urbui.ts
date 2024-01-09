import { Location } from 'react-router-dom';

export type ConnectionStatus = "connected" | "disconnected" | "reconnecting";

export type ReactRouterState = null | {
  backgroundLocation?: Location;
  thenTo?: string;
};

export interface ClassProps {
  className?: string;
}

export interface Class2Props {
  className?: string;
  innerClassName?: string;
}
