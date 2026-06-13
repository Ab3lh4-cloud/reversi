import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SessionsService } from '../sessions/sessions.service';
import { MatchesService } from '../matches/matches.service';
import { UnauthorizedException, MatchNotFoundException, PlayerNotInMatchException } from '../../common/exceptions';
import { MATCH_STATUS, COLORS, TURN_TIMEOUT_SECONDS } from '../../common/constants';

@WebSocketGateway({
  namespace: '/matches',
  cors: { origin: '*', methods: ['GET', 'POST'] },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedSockets: Map<string, { sessionId: string; matchId: string | null }> = new Map();

  constructor(
    private readonly sessionsService: SessionsService,
    private readonly matchesService: MatchesService,
  ) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.auth?.token;
    if (!token) {
      client.emit('match.error', { code: 'UNAUTHORIZED', message: 'Token não fornecido' });
      client.disconnect();
      return;
    }

    try {
      const session = await this.sessionsService.validateSession(token);
      if (!session) {
        client.emit('match.error', { code: 'UNAUTHORIZED', message: 'Sessão inválida' });
        client.disconnect();
        return;
      }

      (client as any).sessionId = session.id;
      this.connectedSockets.set(client.id, { sessionId: session.id, matchId: null });
      console.log(`[WS] Conexão: ${session.id} (${client.id})`);
    } catch (err) {
      client.emit('match.error', { code: 'UNAUTHORIZED', message: 'Erro de autenticação' });
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const info = this.connectedSockets.get(client.id);
    if (info) {
      console.log(`[WS] Desconexão: ${info.sessionId} (${client.id})`);
      if (info.matchId) {
        await this.matchesService.handleDisconnect(info.matchId, info.sessionId);
        client.to(`match:${info.matchId}`).emit('match.player_disconnected', {
          matchId: info.matchId,
          playerSessionId: info.sessionId,
          gracePeriodSeconds: 15,
        });
      }
      this.connectedSockets.delete(client.id);
    }
  }

  @SubscribeMessage('match.join')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { matchId: string },
  ) {
    const sessionId = (client as any).sessionId;
    if (!sessionId) {
      client.emit('match.error', { code: 'UNAUTHORIZED', message: 'Não autenticado' });
      return;
    }

    try {
      const matchState = await this.matchesService.getMatchState(data.matchId, sessionId);
      client.join(`match:${data.matchId}`);

      const info = this.connectedSockets.get(client.id);
      if (info) {
        info.matchId = data.matchId;
      }

      await this.matchesService.handleReconnect(data.matchId, sessionId);

      client.emit('match.state', {
        matchId: data.matchId,
        status: matchState.status,
        board: matchState.board,
        currentTurnColor: matchState.currentTurnColor,
        turnRemainingSeconds: matchState.turnRemainingSeconds,
        scores: matchState.scores,
        validMoves: matchState.validMoves,
        players: matchState.players,
      });

      client.to(`match:${data.matchId}`).emit('match.player_reconnected', {
        matchId: data.matchId,
        playerSessionId: sessionId,
      });

      console.log(`[WS] Join: ${sessionId} na sala ${data.matchId}`);
    } catch (err) {
      if (err instanceof MatchNotFoundException) {
        client.emit('match.error', { code: 'MATCH_NOT_FOUND', message: 'Partida não encontrada' });
      } else if (err instanceof PlayerNotInMatchException) {
        client.emit('match.error', { code: 'PLAYER_NOT_IN_MATCH', message: 'Você não está nesta partida' });
      } else {
        client.emit('match.error', { code: 'INTERNAL_ERROR', message: 'Erro interno' });
      }
    }
  }

  @SubscribeMessage('match.play_move')
  async handlePlayMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { matchId: string; row: number; col: number },
  ) {
    const sessionId = (client as any).sessionId;
    if (!sessionId) {
      client.emit('match.error', { code: 'UNAUTHORIZED', message: 'Não autenticado' });
      return;
    }

    try {
      const result = await this.matchesService.applyMove(
        data.matchId,
        sessionId,
        data.row,
        data.col,
      );

      const moveEvent = {
        matchId: result.matchId,
        moveNumber: result.moveNumber,
        playedBySessionId: result.playedBySessionId,
        playedColor: result.playedColor,
        row: result.row,
        col: result.col,
        flippedPositions: result.flippedPositions,
        board: result.board,
        scores: result.scores,
        nextTurnColor: result.nextTurnColor,
        turnRemainingSeconds: result.turnRemainingSeconds,
        validMoves: result.validMoves,
      };

      this.server.to(`match:${data.matchId}`).emit('match.move_applied', moveEvent);

      if (result.autoPassed) {
        this.server.to(`match:${data.matchId}`).emit('match.auto_pass', {
          matchId: data.matchId,
          skippedColor: result.playedColor,
          nextTurnColor: result.nextTurnColor,
          message: `Jogador ${result.playedColor} não possui jogadas válidas. Turno passado automaticamente.`,
        });
      }

      if (result.gameOver) {
        this.server.to(`match:${data.matchId}`).emit('match.finished', {
          matchId: data.matchId,
          status: MATCH_STATUS.FINISHED,
          winnerSessionId: result.winnerSessionId,
          winnerColor: result.winnerColor,
          winReason: result.winReason,
          scores: result.scores,
        });
      }
    } catch (err: any) {
      const errorCode = err.errorCode || 'INTERNAL_ERROR';
      const message = err.message || 'Erro ao processar jogada';
      client.emit('match.error', { code: errorCode, message });
    }
  }

  emitPlayerJoined(matchId: string, player: any) {
    this.server.to(`match:${matchId}`).emit('match.player_joined', {
      matchId,
      player,
    });
  }

  emitMatchReady(matchId: string) {
    this.server.to(`match:${matchId}`).emit('match.ready', {
      matchId,
      status: MATCH_STATUS.READY,
    });
  }

  emitMatchStarted(matchId: string, data: any) {
    this.server.to(`match:${matchId}`).emit('match.started', data);
  }

  emitTimerUpdate(matchId: string, currentTurnColor: string, turnRemainingSeconds: number) {
    this.server.to(`match:${matchId}`).emit('match.timer', {
      matchId,
      currentTurnColor,
      turnRemainingSeconds,
    });
  }

  emitPlayerDisconnected(matchId: string, playerSessionId: string) {
    this.server.to(`match:${matchId}`).emit('match.player_disconnected', {
      matchId,
      playerSessionId,
      gracePeriodSeconds: 15,
    });
  }

  emitPlayerReconnected(matchId: string, playerSessionId: string) {
    this.server.to(`match:${matchId}`).emit('match.player_reconnected', {
      matchId,
      playerSessionId,
    });
  }
}
