import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MatchesService } from '../matches/matches.service';
import { SessionsService } from '../sessions/sessions.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { PlayerAlreadyInActiveMatchException } from '../../common/exceptions';
import { MATCH_STATUS, PLAYER_STATE, INITIAL_BOARD_STATE } from '../../common/constants';

@Injectable()
export class MatchmakingService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => MatchesService))
    private readonly matchesService: MatchesService,
    @Inject(forwardRef(() => SessionsService))
    private readonly sessionsService: SessionsService,
    @Inject(forwardRef(() => RealtimeGateway))
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async quickMatch(sessionId: string) {
    const activeMatch = await this.prisma.matchPlayer.findFirst({
      where: {
        playerSessionId: sessionId,
        state: { in: [PLAYER_STATE.JOINED, PLAYER_STATE.READY, PLAYER_STATE.PLAYING] },
        match: {
          status: { in: [MATCH_STATUS.WAITING, MATCH_STATUS.READY, MATCH_STATUS.IN_PROGRESS] },
        },
      },
      include: {
        match: true,
      },
    });

    if (activeMatch) {
      if (activeMatch.match.status === MATCH_STATUS.WAITING) {
        const player = await this.sessionsService.findById(sessionId);
        return {
          matchId: activeMatch.matchId,
          status: MATCH_STATUS.WAITING,
          role: activeMatch.isHost ? 'host' : 'guest',
          player: {
            sessionId: player!.id,
            displayName: player!.displayName,
            avatar: {
              id: player!.avatar.id,
              assetKey: player!.avatar.assetKey,
            },
          },
        };
      }

      throw new PlayerAlreadyInActiveMatchException(
        'Jogador já está em uma partida ativa',
      );
    }

    const waitingMatch = await this.prisma.match.findFirst({
      where: {
        status: MATCH_STATUS.WAITING,
      },
      include: {
        matchPlayers: {
          include: {
            playerSession: {
              include: {
                avatar: {
                  select: { id: true, assetKey: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (waitingMatch) {
      if (waitingMatch.matchPlayers.length >= 2) {
        await this.prisma.match.update({
          where: { id: waitingMatch.id },
          data: { status: MATCH_STATUS.READY },
        });
        return this.createNewMatch(sessionId);
      }

      await this.prisma.matchPlayer.create({
        data: {
          matchId: waitingMatch.id,
          playerSessionId: sessionId,
          isHost: false,
          state: PLAYER_STATE.JOINED,
        },
      });

      await this.prisma.match.update({
        where: { id: waitingMatch.id },
        data: { status: MATCH_STATUS.READY },
      });

      await this.sessionsService.updateStatus(sessionId, 'in_match');

      const player = await this.sessionsService.findById(sessionId);

      const hostPlayer = waitingMatch.matchPlayers[0];
      const hostSession = await this.sessionsService.findById(hostPlayer.playerSessionId);

      this.realtimeGateway.emitPlayerJoined(waitingMatch.id, {
        sessionId: player!.id,
        displayName: player!.displayName,
        avatar: {
          assetKey: player!.avatar.assetKey,
        },
      });

      this.realtimeGateway.emitMatchReady(waitingMatch.id);

      console.log(
        `[MATCHMAKING] Jogador ${sessionId} entrou na partida ${waitingMatch.id}`,
      );

      return {
        matchId: waitingMatch.id,
        status: MATCH_STATUS.READY,
        role: 'guest',
        player: {
          sessionId: player!.id,
          displayName: player!.displayName,
          avatar: {
            id: player!.avatar.id,
            assetKey: player!.avatar.assetKey,
          },
        },
      };
    }

    return this.createNewMatch(sessionId);
  }

  private async createNewMatch(sessionId: string) {
    const boardState = INITIAL_BOARD_STATE;

    const match = await this.prisma.match.create({
      data: {
        status: MATCH_STATUS.WAITING,
        hostPlayerSessionId: sessionId,
        boardState,
        boardSize: 8,
        blackScore: 2,
        whiteScore: 2,
        lastMoveNumber: 0,
        matchPlayers: {
          create: {
            playerSessionId: sessionId,
            isHost: true,
            state: PLAYER_STATE.JOINED,
          },
        },
      },
    });

    await this.sessionsService.updateStatus(sessionId, 'in_match');

    const player = await this.sessionsService.findById(sessionId);

    console.log(
      `[MATCHMAKING] Sala criada: ${match.id} pelo jogador ${sessionId}`,
    );

    return {
      matchId: match.id,
      status: MATCH_STATUS.WAITING,
      role: 'host',
      player: {
        sessionId: player!.id,
        displayName: player!.displayName,
        avatar: {
          id: player!.avatar.id,
          assetKey: player!.avatar.assetKey,
        },
      },
    };
  }
}
