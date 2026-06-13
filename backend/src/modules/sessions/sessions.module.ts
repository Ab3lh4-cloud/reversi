import { Module, forwardRef } from '@nestjs/common';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { SessionTokenService } from './session-token.service';
import { AvatarsModule } from '../avatars/avatars.module';

@Module({
  imports: [forwardRef(() => AvatarsModule)],
  controllers: [SessionsController],
  providers: [SessionsService, SessionTokenService],
  exports: [SessionsService, SessionTokenService],
})
export class SessionsModule {}
