import { create } from 'zustand';

export type CellState = 'black' | 'white' | null;
export type Board = CellState[][];
export type MatchStatus = 'waiting' | 'ready' | 'in_progress' | 'finished';
export type WinReason = 'disc_count' | 'resignation' | 'timeout' | 'disconnection';

export interface Position { row: number; col: number }
export interface MatchPlayer { sessionId: string; displayName: string; color: 'black' | 'white' | null; avatar: { assetKey: string }; isHost?: boolean }
export interface MatchState { matchId: string; status: MatchStatus; board: Board; currentTurnColor: 'black' | 'white' | null; turnRemainingSeconds: number; scores: { black: number; white: number }; validMoves: Position[]; players: MatchPlayer[]; moveNumber?: number; lastMove?: Position | null; flippedPositions?: Position[]; winnerSessionId?: string | null; winnerColor?: 'black' | 'white' | null; winReason?: WinReason | null }
export interface FlippingDisc { row: number; col: number; fromColor: 'black' | 'white'; toColor: 'black' | 'white' }

interface MatchStoreState {
  match: MatchState | null;
  loading: boolean;
  error: string | null;
  isMyTurn: boolean;
  myColor: 'black' | 'white' | null;
  flippingDiscs: FlippingDisc[];
  showResult: boolean;
  showHints: boolean;
  connected: boolean;
  opponentConnected: boolean;
  opponentDisconnected: boolean;
  gracePeriodSeconds: number;

  setMatch: (match: MatchState) => void;
  setMyColor: (color: 'black' | 'white' | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setConnected: (connected: boolean) => void;
  setOpponentConnected: (connected: boolean) => void;
  setOpponentDisconnected: (disconnected: boolean, gracePeriod?: number) => void;
  setIsMyTurn: (isMyTurn: boolean) => void;
  setFlippingDiscs: (discs: FlippingDisc[]) => void;
  clearFlippingDiscs: () => void;
  setShowResult: (show: boolean) => void;
  setShowHints: (show: boolean) => void;
  applyMove: (move: { row: number; col: number; color: 'black' | 'white'; flippedPositions: Position[]; board: Board; scores: { black: number; white: number }; nextTurnColor: 'black' | 'white'; turnRemainingSeconds: number; validMoves: Position[] }) => void;
  finishMatch: (winnerSessionId: string, winnerColor: 'black' | 'white', winReason: WinReason, scores: { black: number; white: number }) => void;
  reset: () => void;
}

export const useMatchStore = create<MatchStoreState>((set, get) => ({
  match: null,
  loading: false,
  error: null,
  isMyTurn: false,
  myColor: null,
  flippingDiscs: [],
  showResult: false,
  showHints: true,
  connected: false,
  opponentConnected: true,
  opponentDisconnected: false,
  gracePeriodSeconds: 0,

  setMatch: (match) => set({ match }),
  setMyColor: (color) => set({ myColor: color }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setConnected: (connected) => set({ connected }),
  setOpponentConnected: (connected) => set({ opponentConnected: connected }),
  setOpponentDisconnected: (disconnected, gracePeriod = 15) => set({ opponentDisconnected: disconnected, gracePeriodSeconds: gracePeriod }),
  setIsMyTurn: (isMyTurn) => set({ isMyTurn }),
  setFlippingDiscs: (discs) => set({ flippingDiscs: discs }),
  clearFlippingDiscs: () => set({ flippingDiscs: [] }),
  setShowResult: (show) => set({ showResult: show }),
  setShowHints: (show) => set({ showHints: show }),

  applyMove: (move) => {
    const current = get().match;
    const myColor = get().myColor;
    if (!current) return;
    set({
      match: {
        ...current,
        board: move.board,
        scores: move.scores,
        currentTurnColor: move.nextTurnColor,
        turnRemainingSeconds: move.turnRemainingSeconds,
        validMoves: move.validMoves,
        lastMove: { row: move.row, col: move.col },
        moveNumber: (current.moveNumber || 0) + 1,
      },
      isMyTurn: move.nextTurnColor === myColor,
      flippingDiscs: move.flippedPositions.map((pos) => ({
        row: pos.row, col: pos.col,
        fromColor: move.color === 'black' ? 'white' : 'black',  // pecas capturadas eram da cor do oponente
        toColor: move.color,  // pecas capturadas viram a cor do jogador
      })),
    });
  },

  finishMatch: (winnerSessionId, winnerColor, winReason, scores) => {
    const current = get().match;
    if (!current) return;
    set({
      match: { ...current, status: 'finished', winnerSessionId, winnerColor, winReason, scores, currentTurnColor: null, validMoves: [] },
      isMyTurn: false,
      showResult: true,
    });
  },

  reset: () => set({
    match: null, loading: false, error: null, isMyTurn: false, myColor: null,
    flippingDiscs: [], showResult: false, showHints: true, connected: false, opponentConnected: true,
    opponentDisconnected: false, gracePeriodSeconds: 0,
  }),
}));
