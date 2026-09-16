import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { AppConfig } from '../config/configuration.js';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig, true>) => {
        const database = configService.get('database', { infer: true });
        return {
          type: 'postgres' as const,
          host: database.host,
          port: database.port,
          username: database.username,
          password: database.password,
          database: database.name,
          autoLoadEntities: true,
          // No formal migration system for this technical test: the schema is kept in
          // sync automatically. Safe here because the dataset is fully reproducible
          // from the CSV seed script.
          synchronize: true,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
