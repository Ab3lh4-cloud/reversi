import { Module, forwardRef } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';
import { SessionsModule } from '../sessions/sessions.module';
import { MatchesModule } from '../matches/matches.module';

@Module({
  imports: [forwardRef(() => SessionsModule), forwardRef(() => MatchesModule)],
  providers: [RealtimeGateway],
  exports: [RealtimeGateway],
})
export class RealtimeModule {}
