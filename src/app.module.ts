import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { nestDatabaseOptions } from './database/database.config';
import { HealthController } from './health.controller';
import { PropuestasModule } from './propuestas/propuestas.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({ useFactory: nestDatabaseOptions }),
    PropuestasModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
