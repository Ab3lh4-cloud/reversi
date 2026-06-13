/* ============================================
   OTHELLO MOBILE WEB - Match Store
   ============================================ */

import { create } from 'zustand';
import type { MatchState } from '@/types';

interface MatchStoreState {
  matchState: MatchState | null;
  isConnected: boolean;
  isMyTurn: boolean;
  myColor: 'black' | 'white' | null;
  opponentDisconnected: boolean;
  gracePeriodSeconds: number;
  setMatchState: (state: MatchState) => void;
  setConnected: (connected: boolean) => void;
  setMyTurn: (isMyTurn: boolean) => void;
  setMyColor: (color: 'black' | 'white' | null) => void;
  setOpponentDisconnected: (disconnected: boolean, grace?: number) => void;
  reset: () => void;
}

export const useMatchStore = create<MatchStoreState>((set) => ({
  matchState: null,
  isConnected: false,
  isMyTurn: false,
  myColor: null,
  opponentDisconnected: false,
  gracePeriodSeconds: 0,

  setMatchState: (state: MatchState) =>
    set({ matchState: state }),

  setConnected: (connected: boolean) =>
    set({ isConnected: connected }),

  setMyTurn: (isMyTurn: boolean) =>
    set({ isMyTurn }),

  setMyColor: (color: 'black' | 'white' | null) =>
    set({ myColor: color }),

  setOpponentDisconnected: (disconnected: boolean, grace: number = 0) =>
    set({ opponentDisconnected: disconnected, gracePeriodSeconds: grace }),

  reset: () =>
    set({
      matchState: null,
      isConnected: false,
      isMyTurn: false,
      myColor: null,
      opponentDisconnected: false,
      gracePeriodSeconds: 0,
    }),
}));
