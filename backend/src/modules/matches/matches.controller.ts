import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { MatchesService } from './matches.service';
import { SessionGuard } from '../../common/guards/session.guard';

@Controller('matches')
@UseGuards(SessionGuard)
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get(':matchId')
  async findOne(@Param('matchId') matchId: string, @Req() req: any) {
    const session = req.session;
    const result = await this.matchesService.getMatchDetails(matchId, session.id);
    return {
      success: true,
      data: result,
      message: 'Partida carregada com sucesso',
    };
  }

  @Post(':matchId/start')
  async start(@Param('matchId') matchId: string, @Req() req: any) {
    const session = req.session;
    const result = await this.matchesService.startMatch(matchId, session.id);
    return {
      success: true,
      data: result,
      message: 'Partida iniciada com sucesso',
    };
  }

  @Get(':matchId/state')
  async getState(@Param('matchId') matchId: string, @Req() req: any) {
    const session = req.session;
    const result = await this.matchesService.getMatchState(matchId, session.id);
    return {
      success: true,
      data: result,
      message: 'Estado atual carregado com sucesso',
    };
  }

  @Post(':matchId/resign')
  async resign(@Param('matchId') matchId: string, @Req() req: any) {
    const session = req.session;
    const result = await this.matchesService.resignMatch(matchId, session.id);
    return {
      success: true,
      data: result,
      message: 'Desistência registrada com sucesso',
    };
  }
}
