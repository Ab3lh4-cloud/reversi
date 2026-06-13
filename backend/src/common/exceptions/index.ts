import { HttpException, HttpStatus } from '@nestjs/common';

export class ApiException extends HttpException {
  public readonly errorCode: string;

  constructor(errorCode: string, message: string, status: HttpStatus) {
    super(
      {
        success: false,
        error: {
          code: errorCode,
          message,
        },
      },
      status,
    );
    this.errorCode = errorCode;
  }
}

export class ValidationErrorException extends ApiException {
  constructor(message = 'Dados inválidos') {
    super('VALIDATION_ERROR', message, HttpStatus.BAD_REQUEST);
  }
}

export class UnauthorizedException extends ApiException {
  constructor(message = 'Não autorizado') {
    super('UNAUTHORIZED', message, HttpStatus.UNAUTHORIZED);
  }
}

export class ForbiddenException extends ApiException {
  constructor(message = 'Acesso proibido') {
    super('FORBIDDEN', message, HttpStatus.FORBIDDEN);
  }
}

export class SessionNotFoundException extends ApiException {
  constructor(message = 'Sessão não encontrada') {
    super('SESSION_NOT_FOUND', message, HttpStatus.NOT_FOUND);
  }
}

export class AvatarNotFoundException extends ApiException {
  constructor(message = 'Avatar não encontrado') {
    super('AVATAR_NOT_FOUND', message, HttpStatus.NOT_FOUND);
  }
}

export class MatchNotFoundException extends ApiException {
  constructor(message = 'Partida não encontrada') {
    super('MATCH_NOT_FOUND', message, HttpStatus.NOT_FOUND);
  }
}

export class MatchNotReadyException extends ApiException {
  constructor(message = 'Partida não está pronta para iniciar') {
    super('MATCH_NOT_READY', message, HttpStatus.BAD_REQUEST);
  }
}

export class MatchAlreadyStartedException extends ApiException {
  constructor(message = 'Partida já foi iniciada') {
    super('MATCH_ALREADY_STARTED', message, HttpStatus.BAD_REQUEST);
  }
}

export class MatchAlreadyFinishedException extends ApiException {
  constructor(message = 'Partida já foi finalizada') {
    super('MATCH_ALREADY_FINISHED', message, HttpStatus.BAD_REQUEST);
  }
}

export class PlayerNotInMatchException extends ApiException {
  constructor(message = 'Jogador não está nesta partida') {
    super('PLAYER_NOT_IN_MATCH', message, HttpStatus.FORBIDDEN);
  }
}

export class NotHostException extends ApiException {
  constructor(message = 'Apenas o host pode realizar esta ação') {
    super('NOT_HOST', message, HttpStatus.FORBIDDEN);
  }
}

export class NotPlayerTurnException extends ApiException {
  constructor(message = 'Não é o seu turno') {
    super('NOT_PLAYER_TURN', message, HttpStatus.BAD_REQUEST);
  }
}

export class InvalidMoveException extends ApiException {
  constructor(message = 'Jogada inválida') {
    super('INVALID_MOVE', message, HttpStatus.BAD_REQUEST);
  }
}

export class TimerExpiredException extends ApiException {
  constructor(message = 'Tempo do turno expirou') {
    super('TIMER_EXPIRED', message, HttpStatus.BAD_REQUEST);
  }
}

export class OpponentDisconnectedException extends ApiException {
  constructor(message = 'Oponente desconectado') {
    super('OPPONENT_DISCONNECTED', message, HttpStatus.BAD_REQUEST);
  }
}

export class PlayerAlreadyInActiveMatchException extends ApiException {
  constructor(message = 'Jogador já está em uma partida ativa') {
    super('PLAYER_ALREADY_IN_ACTIVE_MATCH', message, HttpStatus.BAD_REQUEST);
  }
}

export class AvatarInUseException extends ApiException {
  constructor(message = 'Este avatar j? est? sendo usado por outro jogador') {
    super('AVATAR_IN_USE', message, HttpStatus.BAD_REQUEST);
  }
}
