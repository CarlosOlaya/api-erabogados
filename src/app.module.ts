import { Module } from '@nestjs/common';
import { PropuestasModule } from './propuestas/propuestas.module';

@Module({
  imports: [PropuestasModule],
})
export class AppModule {}
