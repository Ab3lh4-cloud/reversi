import { Module, forwardRef } from '@nestjs/common';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';
import { TurnTimerService } from './turn-timer.service';
import { MatchEventsService } from './match-events.service';
import { GameEngineModule } from '../game-engine/game-engine.module';
import { SessionsModule } from '../sessions/sessions.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [
    GameEngineModule,
    forwardRef(() => SessionsModule),
    forwardRef(() => RealtimeModule),
  ],
  controllers: [MatchesController],
  providers: [MatchesService, TurnTimerService, MatchEventsService],
  exports: [MatchesService, TurnTimerService, MatchEventsService],
})
export class MatchesModule {}
