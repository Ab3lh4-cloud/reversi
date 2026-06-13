import { Injectable } from '@nestjs/common';
import { TURN_TIMEOUT_SECONDS } from '../../common/constants';

interface TimerEntry {
  matchId: string;
  color: string;
  deadlineAt: Date;
  timeout: NodeJS.Timeout;
}

@Injectable()
export class TurnTimerService {
  private timers: Map<string, TimerEntry> = new Map();

  private readonly timeoutCallback: ((matchId: string) => void) | null = null;

  setOnTimeoutCallback(callback: (matchId: string) => void) {
    (this as any).timeoutCallback = callback;
  }

  startTimer(matchId: string, color: string, deadlineAt: Date) {
    this.clearTimer(matchId);

    const now = Date.now();
    const remaining = Math.max(0, deadlineAt.getTime() - now);

    if (remaining <= 0) {
      this.triggerTimeout(matchId);
      return;
    }

    const timeout = setTimeout(() => {
      this.triggerTimeout(matchId);
    }, remaining);

    this.timers.set(matchId, { matchId, color, deadlineAt, timeout });
  }

  clearTimer(matchId: string) {
    const existing = this.timers.get(matchId);
    if (existing) {
      clearTimeout(existing.timeout);
      this.timers.delete(matchId);
    }
  }

  getRemainingSeconds(matchId: string): number {
    const entry = this.timers.get(matchId);
    if (!entry) return 0;
    return Math.max(0, Math.floor((entry.deadlineAt.getTime() - Date.now()) / 1000));
  }

  private triggerTimeout(matchId: string) {
    this.timers.delete(matchId);
    const cb = (this as any).timeoutCallback as ((matchId: string) => void) | null;
    if (cb) {
      cb(matchId);
    }
  }
}
