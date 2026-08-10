import { Module } from '@nestjs/common';
import { PdfPrinterService } from '../common/pdf-printer.service';
import { PropuestasController } from './propuestas.controller';
import { PropuestasPublicasController } from './propuestas-publicas.controller';
import { PropuestasService } from './propuestas.service';

@Module({
  controllers: [PropuestasController, PropuestasPublicasController],
  providers: [PropuestasService, PdfPrinterService],
})
export class PropuestasModule {}
