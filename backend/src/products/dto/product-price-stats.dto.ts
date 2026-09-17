import { ApiProperty } from '@nestjs/swagger';
import { ProductSearchResultDto } from './product-search-result.dto.js';

/**
 * Aggregate price stats for products matching a free-text query, used for
 * "cheapest / most expensive / average price" style questions rather than
 * a list of specific products. Includes the actual cheapest/most expensive
 * product (not just the numbers) so the response can name it.
 */
export class ProductPriceStatsDto {
  @ApiProperty()
  query!: string;

  @ApiProperty({ description: 'Number of products matching the query' })
  count!: number;

  @ApiProperty({ nullable: true })
  minPrice!: number | null;

  @ApiProperty({ nullable: true })
  maxPrice!: number | null;

  @ApiProperty({ nullable: true })
  averagePrice!: number | null;

  @ApiProperty({ type: ProductSearchResultDto, nullable: true })
  cheapestProduct!: ProductSearchResultDto | null;

  @ApiProperty({ type: ProductSearchResultDto, nullable: true })
  mostExpensiveProduct!: ProductSearchResultDto | null;
}
