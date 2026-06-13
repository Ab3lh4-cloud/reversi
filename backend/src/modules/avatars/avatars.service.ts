import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AvatarsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllActive() {
    return this.prisma.avatar.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        code: true,
        name: true,
        assetKey: true,
        sortOrder: true,
      },
    });
  }

  async findById(id: string) {
    return this.prisma.avatar.findUnique({
      where: { id },
    });
  }

  async findActiveById(id: string) {
    return this.prisma.avatar.findFirst({
      where: { id, isActive: true },
    });
  }
}
