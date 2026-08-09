import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PdfPrinterService } from '../common/pdf-printer.service';
import { getProposalReport, proposalPdfFileName } from './proposal-report';
import { type ProposalSnapshot, type StoredProposal } from './propuesta.types';

@Injectable()
export class PropuestasService {
  private readonly proposals = new Map<string, StoredProposal>();
  private sequence = 1;

  constructor(private readonly pdfPrinter: PdfPrinterService) {}

  findAll(): StoredProposal[] {
    return [...this.proposals.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  findOne(id: string): StoredProposal {
    const proposal = this.proposals.get(id);
    if (!proposal) throw new NotFoundException('La propuesta solicitada no existe.');
    return proposal;
  }

  create(input: ProposalSnapshot): StoredProposal {
    const id = randomUUID();
    const now = new Date().toISOString();
    const code = `ER-PROP-${String(this.sequence++).padStart(4, '0')}`;
    const proposal: ProposalSnapshot = {
      ...input,
      id,
      code,
      version: Math.max(1, input.version || 1),
      status: 'borrador',
    };
    const stored: StoredProposal = { id, code, proposal, createdAt: now, updatedAt: now };
    this.proposals.set(id, stored);
    return stored;
  }

  update(id: string, input: ProposalSnapshot): StoredProposal {
    const current = this.findOne(id);
    const updatedAt = new Date().toISOString();
    const proposal: ProposalSnapshot = {
      ...input,
      id,
      code: current.code,
      version: current.proposal.version + 1,
      status: 'lista',
    };
    const stored: StoredProposal = {
      id,
      code: current.code,
      proposal,
      createdAt: current.createdAt,
      updatedAt,
    };
    this.proposals.set(id, stored);
    return stored;
  }

  async pdf(id: string): Promise<{ buffer: Buffer; filename: string }> {
    const stored = this.findOne(id);
    const report = getProposalReport(stored.proposal, {
      cover: this.pdfPrinter.imageDataUri('cover-energia.png'),
      logo: this.pdfPrinter.imageDataUri('logo-er.png'),
      team: this.pdfPrinter.imageDataUri('equipo-editorial.jpg'),
    });
    const buffer = await this.pdfPrinter.render(report);
    return { buffer, filename: proposalPdfFileName(stored.proposal) };
  }
}
