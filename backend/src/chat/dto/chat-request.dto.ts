import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ChatRequestDto {
  @ApiProperty({ example: 'I am looking for a phone' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  query!: string;
}
