import { Controller, Get, Header, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import type { PublicProposalResult } from './propuesta.types';
import { PropuestasService } from './propuestas.service';

@Controller('propuestas/publicas')
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
    const asciiFilename = filename
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\x20-\x7E]/g, ' ');
    const encodedFilename = encodeURIComponent(filename);
    response.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodedFilename}`,
      'Content-Length': buffer.length,
      'X-Content-Type-Options': 'nosniff',
    });
    response.send(buffer);
  }

  @Get(':token')
  @Header('Cache-Control', 'no-store')
  @Header('X-Robots-Tag', 'noindex, nofollow, noarchive')
  findOne(@Param('token') token: string): Promise<PublicProposalResult> {
    return this.propuestas.findPublic(token);
  }
}
