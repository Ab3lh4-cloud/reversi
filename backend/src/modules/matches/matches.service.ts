import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GameEngineService } from '../game-engine/game-engine.service';
import { SessionsService } from '../sessions/sessions.service';
import { TurnTimerService } from './turn-timer.service';
import { MatchEventsService } from './match-events.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import {
  MatchNotFoundException,
  PlayerNotInMatchException,
  NotHostException,
  MatchNotReadyException,
  MatchAlreadyStartedException,
  MatchAlreadyFinishedException,
  NotPlayerTurnException,
  InvalidMoveException,
} from '../../common/exceptions';
import {
  MATCH_STATUS,
  PLAYER_STATE,
  WIN_REASON,
  COLORS,
  TURN_TIMEOUT_SECONDS,
} from '../../common/constants';

@Injectable()
export class MatchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gameEngine: GameEngineService,
    @Inject(forwardRef(() => SessionsService))
    private readonly sessionsService: SessionsService,
    private readonly turnTimerService: TurnTimerService,
    private readonly matchEventsService: MatchEventsService,
    @Inject(forwardRef(() => RealtimeGateway))
    private readonly realtimeGateway: RealtimeGateway,
  ) {
    this.turnTimerService.setOnTimeoutCallback((matchId) => {
      this.handleTimeout(matchId).catch((err) =>
        console.error(`[TIMER] Erro ao processar timeout: ${err.message}`),
      );
    });
  }

  async getMatchDetails(matchId: string, sessionId: string) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        matchPlayers: {
          include: {
            playerSession: {
              include: {
                avatar: { select: { id: true, assetKey: true } },
              },
            },
          },
        },
      },
    });

    if (!match) throw new MatchNotFoundException();

    const playerEntry = match.matchPlayers.find(
      (mp) => mp.playerSessionId === sessionId,
    );
    if (!playerEntry) throw new PlayerNotInMatchException();

    return {
      id: match.id,
      status: match.status,
      isHost: playerEntry.isHost,
      players: match.matchPlayers.map((mp) => ({
        sessionId: mp.playerSessionId,
        displayName: mp.playerSession.displayName,
        avatar: {
          id: mp.playerSession.avatar.id,
          assetKey: mp.playerSession.avatar.assetKey,
        },
        color: mp.color,
        isHost: mp.isHost,
      })),
    };
  }

  async startMatch(matchId: string, sessionId: string) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        matchPlayers: true,
      },
    });

    if (!match) throw new MatchNotFoundException();

    const playerEntry = match.matchPlayers.find(
      (mp) => mp.playerSessionId === sessionId,
    );
    if (!playerEntry) throw new PlayerNotInMatchException();
    if (!playerEntry.isHost) throw new NotHostException();
    if (match.status !== MATCH_STATUS.READY) throw new MatchNotReadyException();
    if (match.status === MATCH_STATUS.IN_PROGRESS)
      throw new MatchAlreadyStartedException();

    const players = match.matchPlayers;
    if (players.length < 2) throw new MatchNotReadyException('Partida precisa de 2 jogadores');

    const hostPlayer = players.find((p) => p.isHost)!;
    const guestPlayer = players.find((p) => !p.isHost)!;

    const boardState = this.gameEngine.createInitialBoard();
    const validMoves = this.gameEngine.getValidMoves(boardState, COLORS.BLACK);
    const turnDeadlineAt = new Date(Date.now() + TURN_TIMEOUT_SECONDS * 1000);

    await this.prisma.match.update({
      where: { id: matchId },
      data: {
        status: MATCH_STATUS.IN_PROGRESS,
        boardState,
        currentTurnColor: COLORS.BLACK,
        turnDeadlineAt,
        blackScore: 2,
        whiteScore: 2,
        lastMoveNumber: 0,
        startedAt: new Date(),
      },
    });

    await this.prisma.matchPlayer.update({
      where: { id: hostPlayer.id },
      data: { color: COLORS.BLACK, state: PLAYER_STATE.PLAYING },
    });
    await this.prisma.matchPlayer.update({
      where: { id: guestPlayer.id },
      data: { color: COLORS.WHITE, state: PLAYER_STATE.PLAYING },
    });

    await this.matchEventsService.recordEvent(matchId, null, 'match_started', {
      currentTurnColor: COLORS.BLACK,
      validMoves,
    });

    this.turnTimerService.startTimer(matchId, COLORS.BLACK, turnDeadlineAt);

    const hostSession = await this.sessionsService.findById(hostPlayer.playerSessionId);
    const guestSession = await this.sessionsService.findById(guestPlayer.playerSessionId);

    const startedPayload = {
      matchId,
      status: MATCH_STATUS.IN_PROGRESS,
      currentTurnColor: COLORS.BLACK,
      turnRemainingSeconds: TURN_TIMEOUT_SECONDS,
      players: [
        {
          sessionId: hostPlayer.playerSessionId,
          displayName: hostSession?.displayName,
          color: COLORS.BLACK,
        },
        {
          sessionId: guestPlayer.playerSessionId,
          displayName: guestSession?.displayName,
          color: COLORS.WHITE,
        },
      ],
    };

    this.realtimeGateway.emitMatchStarted(matchId, startedPayload);

    console.log(`[MATCH] Partida ${matchId} iniciada`);

    return {
      matchId,
      status: MATCH_STATUS.IN_PROGRESS,
      boardSize: 8,
      currentTurnColor: COLORS.BLACK,
      players: [
        {
          sessionId: hostPlayer.playerSessionId,
          displayName: hostSession?.displayName,
          color: COLORS.BLACK,
          isHost: true,
        },
        {
          sessionId: guestPlayer.playerSessionId,
          displayName: guestSession?.displayName,
          color: COLORS.WHITE,
          isHost: false,
        },
      ],
      turnDeadlineAt: turnDeadlineAt.toISOString(),
    };
  }

  async getMatchState(matchId: string, sessionId: string) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        matchPlayers: {
          include: {
            playerSession: {
              include: {
                avatar: { select: { id: true, assetKey: true } },
              },
            },
          },
        },
      },
    });

    if (!match) throw new MatchNotFoundException();

    const playerEntry = match.matchPlayers.find(
      (mp) => mp.playerSessionId === sessionId,
    );
    if (!playerEntry) throw new PlayerNotInMatchException();

    if (match.status === MATCH_STATUS.FINISHED) {
      throw new MatchAlreadyFinishedException();
    }

    const turnRemainingSeconds = match.turnDeadlineAt
      ? Math.max(0, Math.floor((match.turnDeadlineAt.getTime() - Date.now()) / 1000))
      : 0;

    const validMoves = match.currentTurnColor
      ? this.gameEngine.getValidMoves(
          match.boardState as (string | null)[][],
          match.currentTurnColor,
        )
      : [];

    return {
      matchId: match.id,
      status: match.status,
      board: match.boardState,
      currentTurnColor: match.currentTurnColor,
      turnRemainingSeconds,
      scores: { black: match.blackScore, white: match.whiteScore },
      validMoves,
      players: match.matchPlayers.map((mp) => ({
        sessionId: mp.playerSessionId,
        displayName: mp.playerSession.displayName,
        color: mp.color,
        avatar: { assetKey: mp.playerSession.avatar.assetKey },
      })),
    };
  }

  async resignMatch(matchId: string, sessionId: string) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        matchPlayers: true,
      },
    });

    if (!match) throw new MatchNotFoundException();
    if (match.status === MATCH_STATUS.FINISHED) throw new MatchAlreadyFinishedException();

    const playerEntry = match.matchPlayers.find(
      (mp) => mp.playerSessionId === sessionId,
    );
    if (!playerEntry) throw new PlayerNotInMatchException();

    const opponent = match.matchPlayers.find(
      (mp) => mp.playerSessionId !== sessionId,
    );

    const winnerSessionId = opponent?.playerSessionId || null;
    const winnerColor = opponent?.color || null;

    await this.prisma.match.update({
      where: { id: matchId },
      data: {
        status: MATCH_STATUS.FINISHED,
        winnerPlayerSessionId: winnerSessionId,
        winnerColor,
        winReason: WIN_REASON.RESIGNATION,
        endedAt: new Date(),
      },
    });

    await this.prisma.matchPlayer.update({
      where: { id: playerEntry.id },
      data: { state: PLAYER_STATE.RESIGNED },
    });

    if (opponent) {
      await this.prisma.matchPlayer.update({
        where: { id: opponent.id },
        data: { state: PLAYER_STATE.WINNER },
      });
    }

    await this.matchEventsService.recordEvent(
      matchId,
      sessionId,
      'player_resigned',
      { winnerSessionId, winReason: WIN_REASON.RESIGNATION },
    );

    this.turnTimerService.clearTimer(matchId);

    this.realtimeGateway.emitPlayerDisconnected(matchId, sessionId);

    this.realtimeGateway.server.to(`match:${matchId}`).emit('match.finished', {
      matchId,
      status: MATCH_STATUS.FINISHED,
      winnerSessionId,
      winnerColor,
      winReason: WIN_REASON.RESIGNATION,
      scores: { black: match.blackScore, white: match.whiteScore },
    });

    console.log(`[MATCH] Desistência: ${sessionId} na partida ${matchId}`);

    return {
      matchId,
      status: MATCH_STATUS.FINISHED,
      winnerSessionId,
      winReason: WIN_REASON.RESIGNATION,
    };
  }

  async applyMove(
    matchId: string,
    sessionId: string,
    row: number,
    col: number,
  ) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        matchPlayers: true,
      },
    });

    if (!match) throw new MatchNotFoundException();
    if (match.status !== MATCH_STATUS.IN_PROGRESS) {
      throw match.status === MATCH_STATUS.FINISHED
        ? new MatchAlreadyFinishedException()
        : new MatchNotReadyException();
    }

    const playerEntry = match.matchPlayers.find(
      (mp) => mp.playerSessionId === sessionId,
    );
    if (!playerEntry) throw new PlayerNotInMatchException();
    if (playerEntry.color !== match.currentTurnColor) {
      throw new NotPlayerTurnException();
    }

    const board = match.boardState as (string | null)[][];
    const result = this.gameEngine.applyMove(board, row, col, playerEntry.color!);

    if (!result.valid) {
      throw new InvalidMoveException();
    }

    const moveNumber = match.lastMoveNumber + 1;

    await this.prisma.matchMove.create({
      data: {
        matchId,
        moveNumber,
        playerSessionId: sessionId,
        color: playerEntry.color!,
        rowIndex: row,
        colIndex: col,
        flippedCount: result.flippedPositions.length,
        flippedPositions: result.flippedPositions,
        boardSnapshotBefore: board,
        boardSnapshotAfter: result.boardAfter,
        turnStartedAt: match.turnDeadlineAt
          ? new Date(match.turnDeadlineAt.getTime() - TURN_TIMEOUT_SECONDS * 1000)
          : new Date(),
      },
    });

    let newTurnDeadlineAt: Date | null = null;
    if (result.nextTurnColor && !result.gameOver) {
      newTurnDeadlineAt = new Date(Date.now() + TURN_TIMEOUT_SECONDS * 1000);
    }

    const updateData: any = {
      boardState: result.boardAfter,
      blackScore: result.scores.black,
      whiteScore: result.scores.white,
      lastMoveNumber: moveNumber,
      currentTurnColor: result.nextTurnColor,
      turnDeadlineAt: newTurnDeadlineAt,
    };

    if (result.gameOver) {
      updateData.status = MATCH_STATUS.FINISHED;
      updateData.winnerPlayerSessionId = result.winner
        ? match.matchPlayers.find((mp) => mp.color === result.winner)
            ?.playerSessionId || null
        : null;
      updateData.winnerColor = result.winner;
      updateData.winReason = result.winReason;
      updateData.endedAt = new Date();

      for (const mp of match.matchPlayers) {
        if (mp.color === result.winner) {
          await this.prisma.matchPlayer.update({
            where: { id: mp.id },
            data: {
              state: PLAYER_STATE.WINNER,
              finalPieceCount: result.winner === COLORS.BLACK ? result.scores.black : result.scores.white,
            },
          });
        } else {
          await this.prisma.matchPlayer.update({
            where: { id: mp.id },
            data: {
              state: PLAYER_STATE.LOSER,
              finalPieceCount: result.winner === COLORS.BLACK ? result.scores.white : result.scores.black,
            },
          });
        }
      }
    }

    await this.prisma.match.update({
      where: { id: matchId },
      data: updateData,
    });

    this.turnTimerService.clearTimer(matchId);
    if (result.nextTurnColor && !result.gameOver) {
      this.turnTimerService.startTimer(matchId, result.nextTurnColor, newTurnDeadlineAt!);
    }

    const autoPassed = result.nextTurnColor === playerEntry.color;

    await this.matchEventsService.recordEvent(
      matchId,
      sessionId,
      autoPassed ? 'auto_pass' : 'turn_started',
      {
        moveNumber,
        color: playerEntry.color,
        row,
        col,
        nextTurnColor: result.nextTurnColor,
        gameOver: result.gameOver,
      },
    );

    if (result.gameOver) {
      await this.matchEventsService.recordEvent(matchId, null, 'match_finished', {
        winnerSessionId: updateData.winnerPlayerSessionId,
        winnerColor: result.winner,
        winReason: result.winReason,
        scores: result.scores,
      });
    }

    console.log(
      `[MATCH] Jogada ${moveNumber}: ${sessionId} (${playerEntry.color}) [${row},${col}] na partida ${matchId}`,
    );

    return {
      matchId,
      moveNumber,
      playedBySessionId: sessionId,
      playedColor: playerEntry.color,
      row,
      col,
      flippedPositions: result.flippedPositions,
      board: result.boardAfter,
      scores: result.scores,
      nextTurnColor: result.nextTurnColor,
      turnRemainingSeconds: newTurnDeadlineAt ? TURN_TIMEOUT_SECONDS : 0,
      validMoves: result.nextTurnColor
        ? this.gameEngine.getValidMoves(result.boardAfter, result.nextTurnColor)
        : [],
      gameOver: result.gameOver,
      winnerSessionId: updateData.winnerPlayerSessionId,
      winnerColor: result.winner,
      winReason: result.winReason,
      autoPassed,
    };
  }

  async handleTimeout(matchId: string) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: { matchPlayers: true },
    });

    if (!match || match.status !== MATCH_STATUS.IN_PROGRESS) return;

    const currentColor = match.currentTurnColor;
    const timeoutPlayer = match.matchPlayers.find(
      (mp) => mp.color === currentColor,
    );
    const opponent = match.matchPlayers.find(
      (mp) => mp.color !== currentColor,
    );

    if (!timeoutPlayer || !opponent) return;

    await this.prisma.match.update({
      where: { id: matchId },
      data: {
        status: MATCH_STATUS.FINISHED,
        winnerPlayerSessionId: opponent.playerSessionId,
        winnerColor: opponent.color,
        winReason: WIN_REASON.TIMEOUT,
        endedAt: new Date(),
      },
    });

    await this.prisma.matchPlayer.update({
      where: { id: timeoutPlayer.id },
      data: { state: PLAYER_STATE.LOSER },
    });
    await this.prisma.matchPlayer.update({
      where: { id: opponent.id },
      data: { state: PLAYER_STATE.WINNER },
    });

    await this.matchEventsService.recordEvent(
      matchId,
      timeoutPlayer.playerSessionId,
      'match_finished',
      {
        winnerSessionId: opponent.playerSessionId,
        winnerColor: opponent.color,
        winReason: WIN_REASON.TIMEOUT,
      },
    );

    this.realtimeGateway.server.to(`match:${matchId}`).emit('match.finished', {
      matchId,
      status: MATCH_STATUS.FINISHED,
      winnerSessionId: opponent.playerSessionId,
      winnerColor: opponent.color,
      winReason: WIN_REASON.TIMEOUT,
      scores: { black: match.blackScore, white: match.whiteScore },
    });

    console.log(`[MATCH] Timeout: ${timeoutPlayer.playerSessionId} na partida ${matchId}`);
  }

  async handleDisconnect(matchId: string, sessionId: string) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: { matchPlayers: true },
    });

    if (!match || match.status !== MATCH_STATUS.IN_PROGRESS) return;

    const disconnectedPlayer = match.matchPlayers.find(
      (mp) => mp.playerSessionId === sessionId,
    );
    if (!disconnectedPlayer) return;

    await this.prisma.matchPlayer.update({
      where: { id: disconnectedPlayer.id },
      data: { state: PLAYER_STATE.DISCONNECTED },
    });

    await this.matchEventsService.recordEvent(
      matchId,
      sessionId,
      'player_disconnected',
      { gracePeriodSeconds: 15 },
    );

    console.log(`[MATCH] Desconexão: ${sessionId} na partida ${matchId}`);
  }

  async handleReconnect(matchId: string, sessionId: string) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: { matchPlayers: true },
    });

    if (!match) return;

    const playerEntry = match.matchPlayers.find(
      (mp) => mp.playerSessionId === sessionId,
    );
    if (!playerEntry) return;

    if (match.status === MATCH_STATUS.IN_PROGRESS) {
      await this.prisma.matchPlayer.update({
        where: { id: playerEntry.id },
        data: { state: PLAYER_STATE.PLAYING },
      });
    }

    await this.matchEventsService.recordEvent(
      matchId,
      sessionId,
      'player_reconnected',
      {},
    );

    console.log(`[MATCH] Reconexão: ${sessionId} na partida ${matchId}`);
  }
}
