import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { SessionsService } from '../../modules/sessions/sessions.service';
import { UnauthorizedException } from '../exceptions';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    @Inject(forwardRef(() => SessionsService))
    private readonly sessionsService: SessionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException('Token de autenticação não fornecido');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new UnauthorizedException('Formato de token inválido');
    }

    const token = parts[1];
    const session = await this.sessionsService.validateSession(token);

    if (!session) {
      throw new UnauthorizedException('Sessão inválida ou expirada');
    }

    request.session = session;
    request.sessionToken = token;
    return true;
  }
}
