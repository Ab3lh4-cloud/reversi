/* ============================================
   OTHELLO MOBILE WEB - Type Definitions
   ============================================ */

// === Avatar ===
export interface Avatar {
  id: string;
  code: string;
  name: string;
  assetKey: string;
  sortOrder: number;
}

// === Player ===
export interface PlayerAvatar {
  id: string;
  name?: string;
  assetKey: string;
}

export interface Player {
  id?: string;
  sessionId: string;
  displayName: string;
  avatar: PlayerAvatar;
  color?: 'black' | 'white' | null;
  isHost?: boolean;
}

// === Session ===
export interface SessionData {
  sessionId: string;
  sessionToken: string;
  player: Player;
}

// === Match ===
export type MatchStatus = 'waiting' | 'ready' | 'in_progress' | 'finished';
export type PlayerRole = 'host' | 'guest';
export type WinReason = 'disc_count' | 'resignation' | 'timeout' | 'disconnection';

export interface QuickMatchResponse {
  matchId: string;
  status: MatchStatus;
  role: PlayerRole;
  player: Player;
}

export interface MatchDetail {
  id: string;
  status: MatchStatus;
  isHost: boolean;
  players: Player[];
}

export interface MatchStartResponse {
  matchId: string;
  status: 'in_progress';
  boardSize: number;
  currentTurnColor: 'black' | 'white';
  players: Player[];
  turnDeadlineAt: string;
}

// === Board ===
export type CellState = 'black' | 'white' | null;
export type Board = CellState[][];

export interface Position {
  row: number;
  col: number;
}

export interface Scores {
  black: number;
  white: number;
}

export interface MatchState {
  matchId: string;
  status: MatchStatus;
  board: Board;
  currentTurnColor: 'black' | 'white';
  turnRemainingSeconds: number;
  scores: Scores;
  validMoves: Position[];
  players: Player[];
}

// === WebSocket Events ===
export interface PlayerJoinedEvent {
  matchId: string;
  player: {
    sessionId: string;
    displayName: string;
    avatar: { assetKey: string };
  };
}

export interface MatchReadyEvent {
  matchId: string;
  status: 'ready';
}

export interface MatchStartedEvent {
  matchId: string;
  status: 'in_progress';
  currentTurnColor: 'black' | 'white';
  turnRemainingSeconds: number;
  players: Player[];
}

export interface MoveAppliedEvent {
  matchId: string;
  moveNumber: number;
  playedBySessionId: string;
  playedColor: 'black' | 'white';
  row: number;
  col: number;
  flippedPositions: Position[];
  board: Board;
  scores: Scores;
  nextTurnColor: 'black' | 'white';
  turnRemainingSeconds: number;
  validMoves: Position[];
}

export interface TimerEvent {
  matchId: string;
  currentTurnColor: 'black' | 'white';
  turnRemainingSeconds: number;
}

export interface AutoPassEvent {
  matchId: string;
  skippedColor: 'black' | 'white';
  nextTurnColor: 'black' | 'white';
  message: string;
}

export interface PlayerDisconnectedEvent {
  matchId: string;
  playerSessionId: string;
  gracePeriodSeconds: number;
}

export interface PlayerReconnectedEvent {
  matchId: string;
  playerSessionId: string;
}

export interface MatchFinishedEvent {
  matchId: string;
  status: 'finished';
  winnerSessionId: string;
  winnerColor: 'black' | 'white';
  winReason: WinReason;
  scores: Scores;
  players: Player[];
}

// === Resign ===
export interface ResignResponse {
  matchId: string;
  status: 'finished';
  winnerSessionId: string;
  winReason: 'resignation';
}

// === API Response ===
export interface ApiSuccess<T> {
  success: true;
  data: T;
  message: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// === Store Types ===
export interface SessionStore {
  sessionToken: string | null;
  sessionId: string | null;
  player: Player | null;
  matchId: string | null;
  playerRole: PlayerRole | null;
  setSession: (data: SessionData) => void;
  setMatchId: (matchId: string, role: PlayerRole) => void;
  clearSession: () => void;
}

export interface MatchStore {
  matchState: MatchState | null;
  isConnected: boolean;
  isMyTurn: boolean;
  myColor: 'black' | 'white' | null;
  opponentDisconnected: boolean;
  gracePeriodSeconds: number;
  setMatchState: (state: MatchState) => void;
  setConnected: (connected: boolean) => void;
  setMyColor: (color: 'black' | 'white' | null) => void;
  setOpponentDisconnected: (disconnected: boolean, grace?: number) => void;
  reset: () => void;
}
