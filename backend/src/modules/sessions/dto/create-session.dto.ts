import { IsString, Length, IsUUID } from 'class-validator';
import { Trim } from '../../../common/decorators/trim.decorator';

export class CreateSessionDto {
  @IsString()
  @Trim()
  @Length(1, 4)
  displayName: string;

  @IsUUID()
  avatarId: string;
}
