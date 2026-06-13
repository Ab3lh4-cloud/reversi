import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PlayerInfo {
  id: string;
  sessionId?: string;
  displayName: string;
  avatar: { id: string; name?: string; assetKey: string };
}

interface SessionState {
  sessionId: string | null;
  sessionToken: string | null;
  player: PlayerInfo | null;
  matchId: string | null;
  matchRole: 'host' | 'guest' | null;

  setSession: (data: { sessionId: string; sessionToken: string; player: PlayerInfo }) => void;
  setMatchId: (matchId: string, role: 'host' | 'guest') => void;
  clearSession: () => void;
  clearMatch: () => void;
  reset: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      sessionId: null,
      sessionToken: null,
      player: null,
      matchId: null,
      matchRole: null,

      setSession: (data) =>
        set({ sessionId: data.sessionId, sessionToken: data.sessionToken, player: data.player }),

      setMatchId: (matchId, role) =>
        set({ matchId, matchRole: role }),

      clearSession: () =>
        set({ sessionId: null, sessionToken: null, player: null }),

      clearMatch: () =>
        set({ matchId: null, matchRole: null }),

      reset: () =>
        set({ sessionId: null, sessionToken: null, player: null, matchId: null, matchRole: null }),
    }),
    {
      name: 'othello-session',
      partialize: (state) => ({
        sessionId: state.sessionId,
        sessionToken: state.sessionToken,
        player: state.player,
      }),
    }
  )
);
