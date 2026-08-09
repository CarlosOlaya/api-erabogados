import { Body, Controller, Get, Param, Patch, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { type ProposalSnapshot, type StoredProposal } from './propuesta.types';
import { PropuestasService } from './propuestas.service';

@Controller('propuestas')
export class PropuestasController {
  constructor(private readonly propuestas: PropuestasService) {}

  @Get()
  findAll(): StoredProposal[] {
    return this.propuestas.findAll();
  }

  @Post()
  create(@Body() proposal: ProposalSnapshot): StoredProposal {
    return this.propuestas.create(proposal);
  }

  @Get(':id/pdf')
  async pdf(@Param('id') id: string, @Res() response: Response): Promise<void> {
    const { buffer, filename } = await this.propuestas.pdf(id);
    const asciiFilename = filename
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\x20-\x7E]/g, ' ');
    const encodedFilename = encodeURIComponent(filename);
    response.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodedFilename}`,
      'Content-Length': buffer.length,
    });
    response.send(buffer);
  }

  @Get(':id')
  findOne(@Param('id') id: string): StoredProposal {
    return this.propuestas.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() proposal: ProposalSnapshot): StoredProposal {
    return this.propuestas.update(id, proposal);
  }
}
