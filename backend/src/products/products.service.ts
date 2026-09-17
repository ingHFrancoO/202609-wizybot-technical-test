import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Product } from './entities/product.entity.js';
import { ProductSearchResultDto } from './dto/product-search-result.dto.js';
import { ProductPriceStatsDto } from './dto/product-price-stats.dto.js';

const SHORT_DESCRIPTION_LENGTH = 200;

interface FullTextPredicate {
  document: string;
  tsQuery: string;
  params: Record<string, string>;
}

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
   * or stop-word-only input, or a query like "phone" that doesn't share a
   * lexeme with "iPhone").
   */
  async search(query: string, limit = 2): Promise<ProductSearchResultDto[]> {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return [];
    }

    const predicate = this.buildFullTextPredicate(trimmedQuery);

    const fullTextResults = await this.applyFullTextMatch(this.productRepository.createQueryBuilder('product'), predicate)
      .orderBy(
        `ts_rank(${predicate.document}, (${predicate.tsQuery}))`,
        'DESC',
      )
      .limit(limit)
      .getMany();

    if (fullTextResults.length > 0) {
      return fullTextResults.map((product) => this.toDto(product));
    }

    this.logger.debug(`No full-text match for "${trimmedQuery}", falling back to ILIKE`);

    // Rank an exact category hit above an incidental substring match inside
    // the title (e.g. "phone" inside "Headphones"), then break ties by
    // title length: a short title ("iPhone 12") is more likely to be
    // directly about the term than a long descriptive one that only
    // mentions it in passing ("...Wireless ... Headphones ... Chip").
    // Plain alphabetical was tried and rejected here — it ranks "iPhone"
    // (lowercase i) after "Beats"/"Open Ear"/"Wireless" under byte-order
    // collation, which is worse than doing nothing.
    const likeResults = await this.applyLikeMatch(this.productRepository.createQueryBuilder('product'), trimmedQuery)
      .orderBy('CASE WHEN product."productType" ILIKE :term THEN 0 ELSE 1 END', 'ASC')
      .addOrderBy('LENGTH(product."displayTitle")', 'ASC')
      .limit(limit)
      .getMany();

    return likeResults.map((product) => this.toDto(product));
  }

  /**
   * Aggregate price stats — min, max, average, count, and the actual
   * cheapest/most expensive product — across every product matching a
   * free-text query (not just the top N), for "cheapest / most expensive /
   * average price" style questions. Reuses the same matching logic as
   * `search()` (full-text first, ILIKE fallback) so results stay consistent
   * between "show me a phone" and "what's the average price of a phone".
   * An empty/omitted query computes stats across the whole catalog (e.g.
   * "what's the cheapest product?" with no specific category).
   *
   * Known limitation: unlike `search()`, this aggregates the *entire*
   * matching set, so an incidental ILIKE substring hit (e.g. "phone" inside
   * "Headphones") skews min/max/avg even though it wouldn't have made the
   * top-2 in `search()`. Category-based disambiguation doesn't help here
   * when both products share the same broad `productType`.
   */
  async getPriceStats(query: string): Promise<ProductPriceStatsDto> {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return this.buildStatsResult(trimmedQuery, (qb) => qb);
    }

    const predicate = this.buildFullTextPredicate(trimmedQuery);
    const fullTextCount = await this.applyFullTextMatch(this.statsQueryBuilder(), predicate).getRawOne<RawPriceStats>();

    if (fullTextCount && Number(fullTextCount.count) > 0) {
      return this.buildStatsResult(trimmedQuery, (qb) => this.applyFullTextMatch(qb, predicate));
    }

    this.logger.debug(`No full-text match for price stats "${trimmedQuery}", falling back to ILIKE`);

    return this.buildStatsResult(trimmedQuery, (qb) => this.applyLikeMatch(qb, trimmedQuery));
  }

  /**
   * Runs the count/average aggregate alongside two ordered lookups (cheapest
   * and priciest product) under the same predicate, so `minPrice`/`maxPrice`
   * are always the exact price of a real, named product rather than a bare
   * number.
   */
  private async buildStatsResult(
    query: string,
    applyPredicate: (qb: SelectQueryBuilder<Product>) => SelectQueryBuilder<Product>,
  ): Promise<ProductPriceStatsDto> {
    const [aggregateRaw, cheapest, priciest] = await Promise.all([
      applyPredicate(this.statsQueryBuilder()).getRawOne<RawPriceStats>(),
      applyPredicate(this.productRepository.createQueryBuilder('product')).orderBy('product.price', 'ASC').getOne(),
      applyPredicate(this.productRepository.createQueryBuilder('product')).orderBy('product.price', 'DESC').getOne(),
    ]);

    return {
      query,
      count: aggregateRaw ? Number(aggregateRaw.count) : 0,
      minPrice: cheapest ? parseFloat(cheapest.price) : null,
      maxPrice: priciest ? parseFloat(priciest.price) : null,
      averagePrice: aggregateRaw?.avg != null ? this.round(parseFloat(aggregateRaw.avg)) : null,
      cheapestProduct: cheapest ? this.toDto(cheapest) : null,
      mostExpensiveProduct: priciest ? this.toDto(priciest) : null,
    };
  }

  private buildFullTextPredicate(trimmedQuery: string): FullTextPredicate {
    const document = `to_tsvector('english',
      coalesce(product."displayTitle", '') || ' ' ||
      coalesce(product."embeddingText", '') || ' ' ||
      coalesce(product."productType", ''))`;

    const terms = trimmedQuery.split(/\s+/).filter(Boolean).slice(0, 8);
    const params = Object.fromEntries(terms.map((term, index) => [`term${index}`, term]));
    const tsQuery = terms.map((_, index) => `plainto_tsquery('english', :term${index})`).join(' || ');

    return { document, tsQuery, params };
  }

  private applyFullTextMatch<T extends object>(
    qb: SelectQueryBuilder<T>,
    predicate: FullTextPredicate,
  ): SelectQueryBuilder<T> {
    return qb.where(`${predicate.document} @@ (${predicate.tsQuery})`, predicate.params);
  }

  private applyLikeMatch<T extends object>(qb: SelectQueryBuilder<T>, trimmedQuery: string): SelectQueryBuilder<T> {
    return qb.where('product."displayTitle" ILIKE :term OR product."productType" ILIKE :term', {
      term: `%${trimmedQuery}%`,
    });
  }

  private statsQueryBuilder(): SelectQueryBuilder<Product> {
    return this.productRepository.createQueryBuilder('product').select('AVG(product.price)', 'avg').addSelect('COUNT(*)', 'count');
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
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

interface RawPriceStats {
  avg: string | null;
  count: string;
}
