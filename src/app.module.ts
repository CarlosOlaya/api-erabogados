import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PropuestasModule } from './propuestas/propuestas.module';

@Module({
  imports: [PropuestasModule],
  controllers: [HealthController],
})
export class AppModule {}
