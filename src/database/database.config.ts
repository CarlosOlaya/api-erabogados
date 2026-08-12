import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'node:path';
import type { DataSourceOptions } from 'typeorm';
import { ProposalEntity } from '../propuestas/propuesta.entity';
import { ProposalVersionEntity } from '../propuestas/propuesta-version.entity';

function requireDatabaseUrl(): string {
  const configuredUrl = process.env.DATABASE_URL?.trim();
  if (configuredUrl) return configuredUrl;

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'DATABASE_URL es obligatoria en producción. Vincule la variable del servicio PostgreSQL de Railway.',
    );
  }

  return 'postgresql://postgres:postgres@localhost:5432/erabogados';
}

function usesSsl(): boolean {
  return process.env.DB_SSL?.trim().toLowerCase() === 'true';
}

export function databaseOptions(): DataSourceOptions {
  return {
    type: 'postgres',
    url: requireDatabaseUrl(),
    entities: [ProposalEntity, ProposalVersionEntity],
    migrations: [join(__dirname, 'migrations', '*.{js,ts}')],
    migrationsTableName: 'er_migrations',
    synchronize: false,
    logging: process.env.NODE_ENV === 'production' ? ['warn', 'error'] : false,
    ssl: usesSsl() ? { rejectUnauthorized: false } : false,
    extra: {
      max: Number(process.env.DB_POOL_MAX || 5),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10_000,
      statement_timeout: 30_000,
    },
  };
}

export function nestDatabaseOptions(): TypeOrmModuleOptions {
  return {
    ...databaseOptions(),
    autoLoadEntities: true,
    retryAttempts: 10,
    retryDelay: 3_000,
  };
}
