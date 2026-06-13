export const BOARD_SIZE = 8;

export const INITIAL_BOARD_STATE = (() => {
  const board: (string | null)[][] = Array.from({ length: 8 }, () =>
    Array(8).fill(null),
  );
  board[3][3] = 'white';
  board[3][4] = 'black';
  board[4][3] = 'black';
  board[4][4] = 'white';
  return board;
})();

export const TURN_TIMEOUT_SECONDS = parseInt(
  process.env.TURN_TIMEOUT_SECONDS || '60',
  10,
);
export const DISCONNECT_GRACE_SECONDS = parseInt(
  process.env.DISCONNECT_GRACE_SECONDS || '15',
  10,
);

export const MATCH_STATUS = {
  WAITING: 'waiting',
  READY: 'ready',
  IN_PROGRESS: 'in_progress',
  FINISHED: 'finished',
  ABANDONED: 'abandoned',
  CANCELLED: 'cancelled',
} as const;

export const PLAYER_STATE = {
  JOINED: 'joined',
  READY: 'ready',
  PLAYING: 'playing',
  RESIGNED: 'resigned',
  DISCONNECTED: 'disconnected',
  WINNER: 'winner',
  LOSER: 'loser',
  DRAW: 'draw',
} as const;

export const WIN_REASON = {
  DISC_COUNT: 'disc_count',
  RESIGNATION: 'resignation',
  TIMEOUT: 'timeout',
  DISCONNECT: 'disconnect',
  CANCELLED: 'cancelled',
} as const;

export const COLORS = {
  BLACK: 'black',
  WHITE: 'white',
} as const;

export const DIRECTIONS = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];
