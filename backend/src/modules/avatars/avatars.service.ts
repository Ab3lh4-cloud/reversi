import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AvatarsService {
  constructor(private readonly prisma: PrismaService) {}

  private get recentCutoff(): Date {
    // Ignora partidas sem atividade ha mais de 30 minutos (evita bloquear avatares de sessoes abandonadas)
    return new Date(Date.now() - 30 * 60 * 1000);
  }

  async findAllActive() {
    const avatars = await this.prisma.avatar.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, code: true, name: true, assetKey: true, sortOrder: true },
    });

    const inUseSessions = await this.prisma.playerSession.findMany({
      where: {
        matchPlayers: {
          some: {
            state: { not: 'left' },
            match: {
              status: { in: ['waiting', 'ready', 'in_progress'] },
              updatedAt: { gte: this.recentCutoff },
            },
          },
        },
      },
      select: { avatarId: true },
      distinct: ['avatarId'],
    });

    const inUseIds = new Set(inUseSessions.map((s) => s.avatarId));
    return avatars.map((a) => ({ ...a, inUse: inUseIds.has(a.id) }));
  }

  async isAvatarInUse(avatarId: string): Promise<boolean> {
    const count = await this.prisma.playerSession.count({
      where: {
        avatarId,
        matchPlayers: {
          some: {
            state: { not: 'left' },
            match: {
              status: { in: ['waiting', 'ready', 'in_progress'] },
              updatedAt: { gte: this.recentCutoff },
            },
          },
        },
      },
    });
    return count > 0;
  }

  async findById(id: string) {
    return this.prisma.avatar.findUnique({ where: { id } });
  }

  async findActiveById(id: string) {
    return this.prisma.avatar.findFirst({ where: { id, isActive: true } });
  }
}
