import { Injectable } from '@nestjs/common';
import { BOARD_SIZE, DIRECTIONS, COLORS } from '../../common/constants';

export interface Position {
  row: number;
  col: number;
}

export interface MoveResult {
  valid: boolean;
  flippedPositions: Position[];
  boardAfter: (string | null)[][];
  scores: { black: number; white: number };
  nextTurnColor: string | null;
  gameOver: boolean;
  winner: string | null;
  winReason: string | null;
}

@Injectable()
export class GameEngineService {
  /**
   * Cria o tabuleiro inicial do Othello
   */
  createInitialBoard(): (string | null)[][] {
    const board: (string | null)[][] = Array.from({ length: BOARD_SIZE }, () =>
      Array(BOARD_SIZE).fill(null),
    );
    board[3][3] = 'white';
    board[3][4] = 'black';
    board[4][3] = 'black';
    board[4][4] = 'white';
    return board;
  }

  /**
   * Retorna a cor oposta
   */
  getOpponentColor(color: string): string {
    return color === COLORS.BLACK ? COLORS.WHITE : COLORS.BLACK;
  }

  /**
   * Verifica se uma posição está dentro do tabuleiro
   */
  isInBounds(row: number, col: number): boolean {
    return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
  }

  /**
   * Calcula as peças que seriam capturadas em uma direção específica
   */
  getFlippedInDirection(
    board: (string | null)[][],
    row: number,
    col: number,
    color: string,
    dRow: number,
    dCol: number,
  ): Position[] {
    const opponent = this.getOpponentColor(color);
    const flipped: Position[] = [];
    let r = row + dRow;
    let c = col + dCol;

    while (this.isInBounds(r, c) && board[r][c] === opponent) {
      flipped.push({ row: r, col: c });
      r += dRow;
      c += dCol;
    }

    if (this.isInBounds(r, c) && board[r][c] === color && flipped.length > 0) {
      return flipped;
    }

    return [];
  }

  /**
   * Calcula todas as posições capturadas para uma jogada
   */
  getFlippedPositions(
    board: (string | null)[][],
    row: number,
    col: number,
    color: string,
  ): Position[] {
    if (!this.isInBounds(row, col) || board[row][col] !== null) {
      return [];
    }

    const allFlipped: Position[] = [];

    for (const [dRow, dCol] of DIRECTIONS) {
      const flipped = this.getFlippedInDirection(
        board,
        row,
        col,
        color,
        dRow,
        dCol,
      );
      allFlipped.push(...flipped);
    }

    return allFlipped;
  }

  /**
   * Verifica se uma jogada é válida
   */
  isValidMove(
    board: (string | null)[][],
    row: number,
    col: number,
    color: string,
  ): boolean {
    if (!this.isInBounds(row, col) || board[row][col] !== null) {
      return false;
    }

    const flipped = this.getFlippedPositions(board, row, col, color);
    return flipped.length > 0;
  }

  /**
   * Calcula todas as jogadas válidas para uma cor
   */
  getValidMoves(
    board: (string | null)[][],
    color: string,
  ): Position[] {
    const moves: Position[] = [];

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (this.isValidMove(board, row, col, color)) {
          moves.push({ row, col });
        }
      }
    }

    return moves;
  }

  /**
   * Aplica uma jogada ao tabuleiro e retorna o resultado completo
   */
  applyMove(
    board: (string | null)[][],
    row: number,
    col: number,
    color: string,
  ): MoveResult {
    // Valida a jogada
    if (!this.isValidMove(board, row, col, color)) {
      return {
        valid: false,
        flippedPositions: [],
        boardAfter: board,
        scores: this.calculateScores(board),
        nextTurnColor: null,
        gameOver: false,
        winner: null,
        winReason: null,
      };
    }

    // Cria cópia do tabuleiro
    const newBoard = board.map((r) => [...r]);

    // Obtém posições capturadas
    const flippedPositions = this.getFlippedPositions(board, row, col, color);

    // Coloca a peça
    newBoard[row][col] = color;

    // Vira as peças capturadas
    for (const pos of flippedPositions) {
      newBoard[pos.row][pos.col] = color;
    }

    // Calcula placar
    const scores = this.calculateScores(newBoard);

    // Verifica se o oponente tem jogadas válidas
    const opponent = this.getOpponentColor(color);
    const opponentMoves = this.getValidMoves(newBoard, opponent);

    let nextTurnColor: string | null = opponent;
    let gameOver = false;
    let winner: string | null = null;
    let winReason: string | null = null;

    if (opponentMoves.length === 0) {
      // Oponente não tem jogadas - verifica se o jogador atual tem
      const currentMoves = this.getValidMoves(newBoard, color);

      if (currentMoves.length === 0) {
        // Ninguém tem jogadas - fim de jogo
        gameOver = true;
        if (scores.black > scores.white) {
          winner = COLORS.BLACK;
        } else if (scores.white > scores.black) {
          winner = COLORS.WHITE;
        }
        winReason = 'disc_count';
        nextTurnColor = null;
      } else {
        // Auto-pass: o oponente não tem jogadas, continua o mesmo jogador
        nextTurnColor = color;
      }
    }

    return {
      valid: true,
      flippedPositions,
      boardAfter: newBoard,
      scores,
      nextTurnColor,
      gameOver,
      winner,
      winReason,
    };
  }

  /**
   * Calcula o placar atual
   */
  calculateScores(board: (string | null)[][]): { black: number; white: number } {
    let black = 0;
    let white = 0;

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (board[row][col] === COLORS.BLACK) black++;
        else if (board[row][col] === COLORS.WHITE) white++;
      }
    }

    return { black, white };
  }

  /**
   * Verifica se o jogo terminou
   */
  isGameOver(board: (string | null)[][]): boolean {
    const blackMoves = this.getValidMoves(board, COLORS.BLACK);
    const whiteMoves = this.getValidMoves(board, COLORS.WHITE);
    return blackMoves.length === 0 && whiteMoves.length === 0;
  }

  /**
   * Determina o vencedor baseado na contagem de peças
   */
  determineWinner(
    board: (string | null)[][],
  ): { winner: string | null; scores: { black: number; white: number } } {
    const scores = this.calculateScores(board);
    let winner: string | null = null;

    if (scores.black > scores.white) {
      winner = COLORS.BLACK;
    } else if (scores.white > scores.black) {
      winner = COLORS.WHITE;
    }

    return { winner, scores };
  }
}
