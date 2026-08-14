import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PdfPrinterService } from '../common/pdf-printer.service';
import { ProposalEntity } from './propuesta.entity';
import { ProposalVersionEntity } from './propuesta-version.entity';
import { PropuestasController } from './propuestas.controller';
import {
  PortalesPublicosController,
  PropuestasPublicasController,
} from './propuestas-publicas.controller';
import { PropuestasService } from './propuestas.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProposalEntity, ProposalVersionEntity])],
  controllers: [
    PropuestasController,
    PropuestasPublicasController,
    PortalesPublicosController,
  ],
  providers: [PropuestasService, PdfPrinterService],
})
export class PropuestasModule {}
