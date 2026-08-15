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
import { PortalNotifier } from './portal-notifier.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProposalEntity, ProposalVersionEntity])],
  // Las públicas van primero: sus rutas son más específicas que `propuestas/:id`
  // y así el emparejamiento no depende de la forma del parámetro.
  controllers: [
    PropuestasPublicasController,
    PortalesPublicosController,
    PropuestasController,
  ],
  providers: [PropuestasService, PdfPrinterService, PortalNotifier],
})
export class PropuestasModule {}
