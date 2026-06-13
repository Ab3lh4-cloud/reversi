import { Module, forwardRef } from '@nestjs/common';
import { MatchmakingController } from './matchmaking.controller';
import { MatchmakingService } from './matchmaking.service';
import { SessionsModule } from '../sessions/sessions.module';
import { MatchesModule } from '../matches/matches.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [
    forwardRef(() => SessionsModule),
    forwardRef(() => MatchesModule),
    forwardRef(() => RealtimeModule),
  ],
  controllers: [MatchmakingController],
  providers: [MatchmakingService],
  exports: [MatchmakingService],
})
export class MatchmakingModule {}
