import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from '../config/configuration.js';
import { validateEnv } from '../config/env.validation.js';
import { DatabaseModule } from '../database/database.module.js';
import { Product } from '../products/entities/product.entity.js';

/**
 * Minimal standalone module for the seed script: just enough to get a
 * database connection and the Product repository, without pulling in the
 * chat/currency modules that the seed doesn't need.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
    }),
    DatabaseModule,
    TypeOrmModule.forFeature([Product]),
  ],
})
export class SeedModule {}
