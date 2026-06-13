import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MatchEventsService {
  constructor(private readonly prisma: PrismaService) {}

  async recordEvent(
    matchId: string,
    playerSessionId: string | null,
    eventType: string,
    payload: any = {},
  ) {
    return this.prisma.matchEvent.create({
      data: {
        matchId,
        playerSessionId,
        eventType,
        payload,
      },
    });
  }

  async getRecentEvents(matchId: string, limit: number = 50) {
    return this.prisma.matchEvent.findMany({
      where: { matchId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
