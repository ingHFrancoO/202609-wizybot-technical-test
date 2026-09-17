import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service.js';
import { ProductSearchResultDto } from './dto/product-search-result.dto.js';
import { ProductPriceStatsDto } from './dto/product-price-stats.dto.js';

/**
 * Exposes the product search logic directly over HTTP so it can be tested
 * in isolation from the chatbot / LLM loop.
 */
@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('search')
  @ApiOperation({ summary: 'Search the product catalog (debug endpoint)' })
  @ApiQuery({ name: 'q', required: true, description: 'Free-text search query' })
  @ApiResponse({ status: 200, type: [ProductSearchResultDto] })
  search(@Query('q') query: string): Promise<ProductSearchResultDto[]> {
    return this.productsService.search(query ?? '');
  }

  @Get('price-stats')
  @ApiOperation({ summary: 'Get min/max/average price for a category or search query (debug endpoint)' })
  @ApiQuery({ name: 'q', required: true, description: 'Free-text search query, e.g. "phone"' })
  @ApiResponse({ status: 200, type: ProductPriceStatsDto })
  getPriceStats(@Query('q') query: string): Promise<ProductPriceStatsDto> {
    return this.productsService.getPriceStats(query ?? '');
  }
}
