import { ApiProperty } from '@nestjs/swagger';

/**
 * Slim product shape returned both to the LLM tool result and to the debug
 * REST endpoint. Deliberately excludes the full `embeddingText` blob to keep
 * the tool result compact and cheap in tokens.
 */
export class ProductSearchResultDto {
  @ApiProperty()
  displayTitle!: string;

  @ApiProperty()
  url!: string;

  @ApiProperty({ nullable: true })
  imageUrl!: string | null;

  @ApiProperty({ nullable: true })
  productType!: string | null;

  @ApiProperty()
  price!: number;

  @ApiProperty()
  discount!: number;

  @ApiProperty({ description: 'Short excerpt of the product description' })
  shortDescription!: string;
}
