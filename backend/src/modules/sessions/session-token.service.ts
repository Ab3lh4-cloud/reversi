import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class SessionTokenService {
  private readonly secret = process.env.SESSION_TOKEN_SECRET || 'default-secret';

  generateToken(): string {
    const raw = crypto.randomBytes(32).toString('hex');
    return `sess_${raw}`;
  }

  hashToken(token: string): string {
    return crypto
      .createHmac('sha256', this.secret)
      .update(token)
      .digest('hex');
  }
}
