import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity.js';
import { ProductSearchResultDto } from './dto/product-search-result.dto.js';

const SHORT_DESCRIPTION_LENGTH = 200;

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  /**
   * Finds products related to a free-text query using Postgres' native
   * full-text search over the title, embedding text and product type.
   * Query terms are OR-ed together (rather than requiring every term to
   * match) so a product related to only part of the query can still surface
   * — ts_rank still favors documents that match more terms. Falls back to a
   * simple ILIKE match so the tool never silently returns nothing when
   * full-text search can't build a usable tsquery (e.g. very short queries
   * or stop-word-only input).
   */
  async search(query: string, limit = 2): Promise<ProductSearchResultDto[]> {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return [];
    }

    const searchDocument = `to_tsvector('english',
      coalesce(product."displayTitle", '') || ' ' ||
      coalesce(product."embeddingText", '') || ' ' ||
      coalesce(product."productType", ''))`;

    const terms = trimmedQuery.split(/\s+/).filter(Boolean).slice(0, 8);
    const termParams = Object.fromEntries(terms.map((term, index) => [`term${index}`, term]));
    const orTsQuery = terms.map((_, index) => `plainto_tsquery('english', :term${index})`).join(' || ');

    const fullTextResults = await this.productRepository
      .createQueryBuilder('product')
      .addSelect(`ts_rank(${searchDocument}, (${orTsQuery}))`, 'rank')
      .where(`${searchDocument} @@ (${orTsQuery})`, termParams)
      .orderBy('rank', 'DESC')
      .limit(limit)
      .getMany();

    if (fullTextResults.length > 0) {
      return fullTextResults.map((product) => this.toDto(product));
    }

    this.logger.debug(`No full-text match for "${trimmedQuery}", falling back to ILIKE`);

    const likeResults = await this.productRepository
      .createQueryBuilder('product')
      .where('product."displayTitle" ILIKE :term OR product."productType" ILIKE :term', {
        term: `%${trimmedQuery}%`,
      })
      .limit(limit)
      .getMany();

    return likeResults.map((product) => this.toDto(product));
  }

  private toDto(product: Product): ProductSearchResultDto {
    return {
      displayTitle: product.displayTitle,
      url: product.url,
      imageUrl: product.imageUrl,
      productType: product.productType,
      price: parseFloat(product.price),
      discount: parseFloat(product.discount),
      shortDescription: product.embeddingText.slice(0, SHORT_DESCRIPTION_LENGTH),
    };
  }
}
