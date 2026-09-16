import { ApiProperty } from '@nestjs/swagger';

export class ConvertCurrencyResultDto {
  @ApiProperty()
  amount!: number;

  @ApiProperty()
  from!: string;

  @ApiProperty()
  to!: string;

  @ApiProperty()
  convertedAmount!: number;

  @ApiProperty({ description: 'ISO timestamp of the exchange rates used for the conversion' })
  rateTimestamp!: string;
}
