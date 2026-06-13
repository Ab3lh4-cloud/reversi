import { Controller, Post, Body } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  async create(@Body() createSessionDto: CreateSessionDto) {
    const result = await this.sessionsService.createSession(createSessionDto);
    return {
      success: true,
      data: result,
      message: 'Sessão criada com sucesso',
    };
  }
}
