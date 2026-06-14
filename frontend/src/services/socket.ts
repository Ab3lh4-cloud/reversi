import { io, Socket } from 'socket.io-client';
import { useSessionStore } from '../stores/sessionStore';
import { useMatchStore, Position, Board, WinReason } from '../stores/matchStore';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001';

let socket: Socket | null = null;

// ==========================================
// Socket Event Types
// ==========================================

interface MatchJoinPayload {
  matchId: string;
}

interface MatchPlayerJoinedPayload {
  matchId: string;
  player: {
    sessionId: string;
    displayName: string;
    avatar: { assetKey: string };
  };
}

interface MatchReadyPayload {
  matchId: string;
  status: 'ready';
}

interface MatchStartedPayload {
  matchId: string;
  status: 'in_progress';
  currentTurnColor: 'black' | 'white';
  turnRemainingSeconds: number;
  showHints?: boolean;
  players: Array<{
    sessionId: string;
    displayName: string;
    color: 'black' | 'white';
  }>;
}

interface MatchStatePayload {
  matchId: string;
  status: string;
  board: (string | null)[][];
  currentTurnColor: 'black' | 'white';
  turnRemainingSeconds: number;
  scores: { black: number; white: number };
  validMoves: Position[];
  players?: Array<{ sessionId: string; displayName: string; color: string | null; avatar: { assetKey: string } }>;
}

interface MatchMoveAppliedPayload {
  matchId: string;
  moveNumber: number;
  playedBySessionId: string;
  playedColor: 'black' | 'white';
  row: number;
  col: number;
  flippedPositions: Position[];
  board: (string | null)[][];
  scores: { black: number; white: number };
  nextTurnColor: 'black' | 'white';
  turnRemainingSeconds: number;
  validMoves: Position[];
}

interface MatchTimerPayload {
  matchId: string;
  currentTurnColor: 'black' | 'white';
  turnRemainingSeconds: number;
}

interface MatchAutoPassPayload {
  matchId: string;
  skippedColor: 'black' | 'white';
  nextTurnColor: 'black' | 'white';
  message: string;
}

interface MatchPlayerDisconnectedPayload {
  matchId: string;
  playerSessionId: string;
  gracePeriodSeconds: number;
}

interface MatchPlayerReconnectedPayload {
  matchId: string;
  playerSessionId: string;
}

interface MatchFinishedPayload {
  matchId: string;
  status: 'finished';
  winnerSessionId: string;
  winnerColor: 'black' | 'white';
  winReason: WinReason;
  scores: { black: number; white: number };
  players: Array<{
    sessionId: string;
    displayName: string;
    avatar: { assetKey: string };
  }>;
}

// ==========================================
// Socket Service
// ==========================================

export function connectSocket(): Socket {
  if (socket?.connected) {
    return socket;
  }

  const token = useSessionStore.getState().sessionToken;

  socket = io(`${WS_URL}/matches`, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Conectado');
    useMatchStore.getState().setConnected(true);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Desconectado:', reason);
    useMatchStore.getState().setConnected(false);
  });

  socket.on('connect_error', (error) => {
    console.error('[Socket] Erro de conexão:', error.message);
    useMatchStore.getState().setConnected(false);
  });

  // Eventos da partida
  socket.on('match.player_joined', (payload: MatchPlayerJoinedPayload) => {
    console.log('[Socket] player_joined:', payload);
    const store = useMatchStore.getState();
    const currentMatch = store.match;
    if (currentMatch) {
      const alreadyIn = currentMatch.players.some(
        (p) => p.sessionId === payload.player.sessionId
      );
      if (!alreadyIn) {
        const newPlayers = [
          ...currentMatch.players,
          {
            sessionId: payload.player.sessionId,
            displayName: payload.player.displayName,
            color: null as 'black' | 'white' | null,
            avatar: payload.player.avatar,
          },
        ];
        store.setMatch({ ...currentMatch, players: newPlayers });
      }
    }
  });

  socket.on('match.ready', (payload: MatchReadyPayload) => {
    console.log('[Socket] ready:', payload);
    const store = useMatchStore.getState();
    const currentMatch = store.match;
    if (currentMatch) {
      store.setMatch({ ...currentMatch, status: 'ready' });
    }
  });

  socket.on('match.started', (payload: MatchStartedPayload) => {
    console.log('[Socket] started:', payload);
    const store = useMatchStore.getState();
    const mySessionId = useSessionStore.getState().sessionId;
    const myPlayer = payload.players.find((p) => p.sessionId === mySessionId);
    const myColor = myPlayer?.color || null;

    store.setMyColor(myColor);
    store.setShowHints(payload.showHints !== false);
    store.setMatch({
      matchId: payload.matchId,
      status: 'in_progress',
      board: createInitialBoard(),
      currentTurnColor: payload.currentTurnColor,
      turnRemainingSeconds: payload.turnRemainingSeconds,
      scores: { black: 2, white: 2 },
      validMoves: [],
      players: payload.players.map((p) => ({
        sessionId: p.sessionId,
        displayName: p.displayName,
        color: p.color,
        avatar: { assetKey: '' },
      })),
    });
    store.setIsMyTurn(payload.currentTurnColor === myColor);
  });

  socket.on('match.state', (payload: MatchStatePayload) => {
    console.log('[Socket] state:', payload);
    const store = useMatchStore.getState();
    const mySessionId = useSessionStore.getState().sessionId;

    // Definir myColor a partir dos players se ainda nao definido
    if (!store.myColor && payload.players) {
      const myPlayer = payload.players.find((p) => p.sessionId === mySessionId);
      if (myPlayer?.color) {
        store.setMyColor(myPlayer.color as 'black' | 'white');
      }
    }
    const myColor = store.myColor;

    store.setMatch({
      matchId: payload.matchId,
      status: payload.status as any,
      board: payload.board as Board,
      currentTurnColor: payload.currentTurnColor,
      turnRemainingSeconds: payload.turnRemainingSeconds,
      scores: payload.scores,
      validMoves: payload.validMoves,
      players: payload.players
        ? payload.players.map((p) => ({
            sessionId: p.sessionId,
            displayName: p.displayName,
            color: p.color as 'black' | 'white' | null,
            avatar: p.avatar,
          }))
        : store.match?.players ?? [],
    });
    store.setIsMyTurn(payload.currentTurnColor === myColor);
  });

  socket.on('match.move_applied', (payload: MatchMoveAppliedPayload) => {
    console.log('[Socket] move_applied:', payload);
    const store = useMatchStore.getState();
    const myColor = store.myColor;

    store.applyMove({
      row: payload.row,
      col: payload.col,
      color: payload.playedColor,
      flippedPositions: payload.flippedPositions,
      board: payload.board as Board,
      scores: payload.scores,
      nextTurnColor: payload.nextTurnColor,
      turnRemainingSeconds: payload.turnRemainingSeconds,
      validMoves: payload.validMoves,
    });
    setTimeout(() => { useMatchStore.getState().clearFlippingDiscs(); }, 700);
  });

  socket.on('match.timer', (payload: MatchTimerPayload) => {
    console.log('[Socket] timer:', payload);
    const store = useMatchStore.getState();
    const currentMatch = store.match;
    if (currentMatch) {
      store.setMatch({
        ...currentMatch,
        currentTurnColor: payload.currentTurnColor,
        turnRemainingSeconds: payload.turnRemainingSeconds,
      });
    }
  });

  socket.on('match.auto_pass', (payload: MatchAutoPassPayload) => {
    console.log('[Socket] auto_pass:', payload);
    const store = useMatchStore.getState();
    const currentMatch = store.match;
    const myColor = store.myColor;
    if (currentMatch) {
      store.setMatch({
        ...currentMatch,
        currentTurnColor: payload.nextTurnColor,
      });
      store.setIsMyTurn(payload.nextTurnColor === myColor);
    }
  });

  socket.on('match.player_disconnected', (payload: MatchPlayerDisconnectedPayload) => {
    console.log('[Socket] player_disconnected:', payload);
    const store = useMatchStore.getState();
    store.setOpponentDisconnected(true, payload.gracePeriodSeconds);
  });

  socket.on('match.player_reconnected', (payload: MatchPlayerReconnectedPayload) => {
    console.log('[Socket] player_reconnected:', payload);
    const store = useMatchStore.getState();
    store.setOpponentDisconnected(false);
    store.setOpponentConnected(true);
  });

  socket.on('match.finished', (payload: MatchFinishedPayload) => {
    console.log('[Socket] finished:', payload);
    const store = useMatchStore.getState();
    store.finishMatch(
      payload.winnerSessionId,
      payload.winnerColor,
      payload.winReason,
      payload.scores
    );
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

export function joinMatchRoom(matchId: string): void {
  if (!socket) return;
  if (socket.connected) {
    socket.emit('match.join', { matchId });
  } else {
    socket.once('connect', () => {
      socket?.emit('match.join', { matchId });
    });
  }
}

export function playMove(matchId: string, row: number, col: number): void {
  if (socket?.connected) {
    socket.emit('match.play_move', { matchId, row, col });
  }
}

export function emitResign(matchId: string): void {
  if (socket?.connected) {
    socket.emit('match.resign', { matchId });
  }
}

export function getSocket(): Socket | null {
  return socket;
}

function createInitialBoard(): Board {
  const board: Board = Array.from({ length: 8 }, () =>
    Array.from({ length: 8 }, () => null)
  );
  board[3][3] = 'white';
  board[3][4] = 'black';
  board[4][3] = 'black';
  board[4][4] = 'white';
  return board;
}
