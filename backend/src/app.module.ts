import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { AvatarsModule } from './modules/avatars/avatars.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { MatchmakingModule } from './modules/matchmaking/matchmaking.module';
import { MatchesModule } from './modules/matches/matches.module';
import { GameEngineModule } from './modules/game-engine/game-engine.module';
import { RealtimeModule } from './modules/realtime/realtime.module';

@Module({
  imports: [
    PrismaModule,
    HealthModule,
    AvatarsModule,
    SessionsModule,
    MatchmakingModule,
    MatchesModule,
    GameEngineModule,
    RealtimeModule,
  ],
})
export class AppModule {}
