import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SessionTokenService } from './session-token.service';
import { AvatarsService } from '../avatars/avatars.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { AvatarNotFoundException } from '../../common/exceptions';

@Injectable()
export class SessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionTokenService: SessionTokenService,
    @Inject(forwardRef(() => AvatarsService))
    private readonly avatarsService: AvatarsService,
  ) {}

  async createSession(createSessionDto: CreateSessionDto) {
    const { displayName, avatarId } = createSessionDto;

    const avatar = await this.avatarsService.findActiveById(avatarId);
    if (!avatar) {
      throw new AvatarNotFoundException('Avatar não encontrado ou inativo');
    }

    const sessionToken = this.sessionTokenService.generateToken();
    const tokenHash = this.sessionTokenService.hashToken(sessionToken);

    const session = await this.prisma.playerSession.create({
      data: {
        displayName: displayName.trim(),
        avatarId,
        sessionTokenHash: tokenHash,
        status: 'active',
      },
      include: {
        avatar: {
          select: {
            id: true,
            name: true,
            assetKey: true,
          },
        },
      },
    });

    console.log(`[SESSION] Sessão criada: ${session.id} - ${displayName}`);

    return {
      sessionId: session.id,
      sessionToken,
      player: {
        id: session.id,
        displayName: session.displayName,
        avatar: session.avatar,
      },
    };
  }

  async validateSession(token: string) {
    const tokenHash = this.sessionTokenService.hashToken(token);

    const session = await this.prisma.playerSession.findUnique({
      where: { sessionTokenHash: tokenHash },
      include: {
        avatar: {
          select: {
            id: true,
            name: true,
            assetKey: true,
          },
        },
      },
    });

    if (!session) {
      return null;
    }

    if (session.status === 'expired') {
      return null;
    }

    // Update last_seen_at
    await this.prisma.playerSession.update({
      where: { id: session.id },
      data: { lastSeenAt: new Date() },
    });

    return session;
  }

  async findById(id: string) {
    return this.prisma.playerSession.findUnique({
      where: { id },
      include: {
        avatar: {
          select: {
            id: true,
            name: true,
            assetKey: true,
          },
        },
      },
    });
  }

  async updateStatus(sessionId: string, status: string) {
    return this.prisma.playerSession.update({
      where: { id: sessionId },
      data: { status },
    });
  }
}
