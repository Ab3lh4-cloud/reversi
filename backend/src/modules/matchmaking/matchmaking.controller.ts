import { Controller, Post, UseGuards, Req } from '@nestjs/common';
import { MatchmakingService } from './matchmaking.service';
import { SessionGuard } from '../../common/guards/session.guard';

@Controller('matchmaking')
export class MatchmakingController {
  constructor(private readonly matchmakingService: MatchmakingService) {}

  @Post('quick-match')
  @UseGuards(SessionGuard)
  async quickMatch(@Req() req: any) {
    const session = req.session;
    const result = await this.matchmakingService.quickMatch(session.id);
    return {
      success: true,
      data: result,
      message: result.status === 'waiting'
        ? 'Sala criada e aguardando oponente'
        : 'Você entrou na partida rápida',
    };
  }
}
