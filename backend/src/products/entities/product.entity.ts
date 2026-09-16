import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * A product imported from products_list.csv.
 *
 * `price` and `discount` are assumed to be expressed in USD, since the source
 * CSV does not carry an explicit currency column. `convertCurrencies()` is
 * used downstream to convert into whatever currency the user asks for.
 */
@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  displayTitle!: string;

  @Column({ type: 'text' })
  embeddingText!: string;

  // Unique natural key: lets the seed script upsert idempotently on re-runs.
  @Index({ unique: true })
  @Column({ type: 'text' })
  url!: string;

  @Column({ type: 'text', nullable: true })
  imageUrl!: string | null;

  @Column({ type: 'text', nullable: true })
  productType!: string | null;

  // numeric (not float) to avoid rounding drift when converting currencies.
  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  discount!: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  price!: string;

  // Typed `any`: TypeORM's QueryDeepPartialEntity can't deep-map a union of
  // object/array shapes for a jsonb passthrough column, and the actual shape
  // varies per product.
  @Column({ type: 'jsonb', nullable: true })
  variants!: any;

  @Column({ type: 'timestamptz', nullable: true })
  createDate!: Date | null;
}
