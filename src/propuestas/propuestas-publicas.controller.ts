import {
  Controller,
  Get,
  Header,
  Param,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { PublicRateLimitGuard } from '../common/public-rate-limit.guard';
import type { PublicProposalResult } from './propuesta.types';
import { PropuestasService } from './propuestas.service';

/**
 * `Content-Disposition` necesita el nombre en ASCII para clientes antiguos y
 * el codificado en UTF-8 para los actuales: los nombres de empresa colombianos
 * llevan tildes y eñes.
 */
const sendPdf = (response: Response, buffer: Buffer, filename: string): void => {
  const asciiFilename = filename
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\x20-\x7E]/g, ' ');

  response.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    'Content-Length': buffer.length,
    'X-Content-Type-Options': 'nosniff',
  });
  response.send(buffer);
};

@Controller('propuestas/publicas')
@UseGuards(PublicRateLimitGuard)
export class PropuestasPublicasController {
  constructor(private readonly propuestas: PropuestasService) {}

  @Get(':token/pdf')
  @Header('Cache-Control', 'no-store')
  @Header('X-Robots-Tag', 'noindex, nofollow, noarchive')
  async pdf(
    @Param('token') token: string,
    @Res() response: Response,
  ): Promise<void> {
    const { buffer, filename } = await this.propuestas.publicPdf(token);
    sendPdf(response, buffer, filename);
  }

  @Get(':token')
  @Header('Cache-Control', 'no-store')
  @Header('X-Robots-Tag', 'noindex, nofollow, noarchive')
  findOne(
    @Param('token') token: string,
    @Query('interno') interno?: string,
  ): Promise<PublicProposalResult> {
    return this.propuestas.findPublic(token, interno === '1');
  }
}

@Controller('propuestas/portales')
@UseGuards(PublicRateLimitGuard)
export class PortalesPublicosController {
  constructor(private readonly propuestas: PropuestasService) {}

  @Get(':slug/pdf')
  @Header('Cache-Control', 'no-store')
  @Header('X-Robots-Tag', 'noindex, nofollow, noarchive')
  async pdf(
    @Param('slug') slug: string,
    @Res() response: Response,
  ): Promise<void> {
    const { buffer, filename } = await this.propuestas.publicPdfBySlug(slug);
    sendPdf(response, buffer, filename);
  }

  /**
   * `interno=1` lo envía el estudio cuando quien abre el portal tiene sesión:
   * la vista se sirve igual, pero no suma al contador ni dispara el aviso.
   */
  @Get(':slug')
  @Header('Cache-Control', 'no-store')
  @Header('X-Robots-Tag', 'noindex, nofollow, noarchive')
  findOne(
    @Param('slug') slug: string,
    @Query('interno') interno?: string,
  ): Promise<PublicProposalResult> {
    return this.propuestas.findPublicBySlug(slug, interno === '1');
  }
}
