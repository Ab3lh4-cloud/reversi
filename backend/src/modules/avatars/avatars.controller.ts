import { Controller, Get } from '@nestjs/common';
import { AvatarsService } from './avatars.service';

@Controller('avatars')
export class AvatarsController {
  constructor(private readonly avatarsService: AvatarsService) {}

  @Get()
  async findAll() {
    const avatars = await this.avatarsService.findAllActive();
    return {
      success: true,
      data: avatars,
      message: 'Avatares carregados com sucesso',
    };
  }
}
