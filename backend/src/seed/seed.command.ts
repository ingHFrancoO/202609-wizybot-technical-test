import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { parse } from 'csv-parse/sync';
import type { QueryDeepPartialEntity, Repository } from 'typeorm';
import type { AppConfig } from '../config/configuration.js';
import { Product } from '../products/entities/product.entity.js';
import type { ProductCsvRow } from './csv-row.interface.js';
import { SeedModule } from './seed.module.js';

const BATCH_SIZE = 200;
const UPDATABLE_COLUMNS = [
  'displayTitle',
  'embeddingText',
  'imageUrl',
  'productType',
  'discount',
  'price',
  'variants',
  'createDate',
];

const logger = new Logger('SeedProducts');

function parseNumeric(value: string, fieldName: string, rowLabel: string): string {
  // Handles values like "17.0 USD" (parseFloat reads the leading number and
  // ignores the currency suffix) and price ranges like "13.0 - 15.0 USD"
  // (takes the lower bound). Falls back to 0 for genuinely malformed cells.
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) {
    logger.warn(`Could not parse "${fieldName}" for "${rowLabel}", defaulting to 0. Raw value: ${JSON.stringify(value)}`);
    return '0.00';
  }
  return parsed.toFixed(2);
}

function parseVariants(value: string): any {
  if (!value?.trim()) {
    return null;
  }
  try {
    return JSON.parse(value);
  } catch {
    // Most source exports describe variants as plain text (e.g.
    // "Size (S, M, L), Color (Red, Black)") rather than JSON — keep it as-is
    // instead of discarding it.
    return value.trim();
  }
}

/**
 * Some source exports contain unescaped double quotes inside a quoted field
 * (e.g. an inches mark in a title: `"VAVSEA 8" Professional Chef's Knife"`),
 * which breaks strict CSV parsing ("found non trimable byte after quote").
 * Repairs those in place, line by line: a `"` while already inside a quoted
 * field is only treated as the real closing quote when immediately followed
 * by a comma or end of line; otherwise it's escaped as a literal quote.
 * Assumes one record per line, which holds for this dataset.
 */
function repairUnescapedQuotes(csvText: string): string {
  return csvText
    .split(/\r\n|\n/)
    .map((line) => {
      if (!line.includes('"')) {
        return line;
      }

      let result = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char !== '"') {
          result += char;
          continue;
        }

        if (!inQuotes) {
          inQuotes = true;
          result += char;
          continue;
        }

        const nextChar = line[i + 1];
        if (nextChar === '"') {
          result += '""'; // already-escaped quote
          i++;
        } else if (nextChar === undefined || nextChar === ',') {
          inQuotes = false; // genuine closing quote
          result += char;
        } else {
          result += '""'; // stray quote: escape it as a literal
        }
      }
      return result;
    })
    .join('\n');
}

function parseDate(value: string): Date | null {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function mapRow(row: ProductCsvRow): QueryDeepPartialEntity<Product> {
  return {
    displayTitle: row.displayTitle,
    embeddingText: row.embeddingText,
    url: row.url,
    imageUrl: row.imageUrl || null,
    productType: row.productType || null,
    discount: parseNumeric(row.discount, 'discount', row.displayTitle),
    price: parseNumeric(row.price, 'price', row.displayTitle),
    variants: parseVariants(row.variants),
    createDate: parseDate(row.createDate),
  };
}

async function seed(): Promise<void> {
  const app = await NestFactory.createApplicationContext(SeedModule, {
    logger: ['log', 'warn', 'error'],
  });

  try {
    const configService = app.get(ConfigService<AppConfig, true>);
    const csvProductsPath = configService.get('csvProductsPath', { infer: true });
    const absolutePath = resolve(process.cwd(), csvProductsPath);

    logger.log(`Reading products from ${absolutePath}`);
    const fileContent = repairUnescapedQuotes(readFileSync(absolutePath, 'utf-8'));
    const rows = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as ProductCsvRow[];

    logger.log(`Parsed ${rows.length} rows from CSV`);

    const productRepository = app.get<Repository<Product>>(getRepositoryToken(Product));

    let seededCount = 0;
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE).map(mapRow);

      // ON CONFLICT (url) DO UPDATE: re-running the seed updates existing
      // products instead of duplicating them.
      await productRepository
        .createQueryBuilder()
        .insert()
        .into(Product)
        .values(batch)
        .orUpdate(UPDATABLE_COLUMNS, ['url'])
        .execute();

      seededCount += batch.length;
      logger.log(`Seeded ${seededCount}/${rows.length} products`);
    }

    logger.log(`Done. Seeded ${seededCount} products.`);
  } finally {
    await app.close();
  }
}

seed().catch((error: unknown) => {
  logger.error('Seed script failed', error instanceof Error ? error.stack : error);
  process.exit(1);
});
