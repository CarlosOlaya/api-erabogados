import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes, randomUUID } from 'node:crypto';
import { PdfPrinterService } from '../common/pdf-printer.service';
import { getProposalReport, proposalPdfFileName } from './proposal-report';
import {
  type PublicationResult,
  type ProposalPublication,
  type ProposalSnapshot,
  type PublicProposalResult,
  type PublicProposalSnapshot,
  type RevocationResult,
  type StoredProposal,
} from './propuesta.types';

type PublishedProposal = StoredProposal & {
  publication: ProposalPublication & { status: 'published' };
  publishedSnapshot: PublicProposalSnapshot;
};

@Injectable()
export class PropuestasService {
  private readonly proposals = new Map<string, StoredProposal>();
  private sequence = 1;

  constructor(private readonly pdfPrinter: PdfPrinterService) {}

  findAll(): StoredProposal[] {
    return [...this.proposals.values()].sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt),
    );
  }

  findOne(id: string): StoredProposal {
    const proposal = this.proposals.get(id);
    if (!proposal)
      throw new NotFoundException('La propuesta solicitada no existe.');
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
    const stored: StoredProposal = {
      id,
      code,
      proposal,
      createdAt: now,
      updatedAt: now,
    };
    this.proposals.set(id, stored);
    return stored;
  }

  update(id: string, input: ProposalSnapshot): StoredProposal {
    const current = this.findOne(id);
    const updatedAt = new Date().toISOString();
    const version = current.publication
      ? Math.max(current.proposal.version, current.publication.version + 1)
      : current.proposal.version;
    const proposal: ProposalSnapshot = {
      ...input,
      id,
      code: current.code,
      version,
      status: 'lista',
    };
    const stored: StoredProposal = {
      id,
      code: current.code,
      proposal,
      createdAt: current.createdAt,
      updatedAt,
      publication: current.publication,
      publishedSnapshot: current.publishedSnapshot,
    };
    this.proposals.set(id, stored);
    return stored;
  }

  async pdf(id: string): Promise<{ buffer: Buffer; filename: string }> {
    const stored = this.findOne(id);
    return this.renderPdf(stored.proposal);
  }

  publish(id: string): PublicationResult {
    const current = this.findOne(id);
    this.assertPublishable(current.proposal);

    if (
      current.publication?.status === 'published' &&
      current.publication.version === current.proposal.version &&
      current.publishedSnapshot
    ) {
      return this.toPublicationResult(current);
    }

    const now = new Date().toISOString();
    const token = current.publication?.token ?? this.createPublicToken();
    const proposal: ProposalSnapshot = {
      ...current.proposal,
      status: 'publicada',
    };
    const publishedSnapshot = this.toPublicSnapshot(proposal);
    const publication = {
      token,
      version: proposal.version,
      status: 'published' as const,
      publishedAt: now,
      updatedAt: now,
      viewCount: current.publication?.viewCount ?? 0,
      lastViewedAt: current.publication?.lastViewedAt,
      revokedAt: undefined,
    };

    const stored: StoredProposal = {
      ...current,
      proposal,
      publication,
      publishedSnapshot,
      updatedAt: now,
    };
    this.proposals.set(id, stored);

    return this.toPublicationResult(stored);
  }

  findPublic(token: string): PublicProposalResult {
    const current = this.trackPublicAccess(this.findPublished(token));

    return {
      code: current.code,
      version: current.publication.version,
      publishedAt: current.publication.publishedAt,
      proposal: current.publishedSnapshot,
    };
  }

  async publicPdf(
    token: string,
  ): Promise<{ buffer: Buffer; filename: string }> {
    const current = this.trackPublicAccess(this.findPublished(token));
    return this.renderPdf(this.toReportSnapshot(current));
  }

  revoke(id: string): RevocationResult {
    const current = this.findOne(id);
    if (!current.publication) {
      throw new NotFoundException(
        'La propuesta todavía no tiene una publicación.',
      );
    }

    if (current.publication.status === 'revoked') {
      return {
        proposalId: id,
        token: current.publication.token,
        status: 'revoked',
        revokedAt:
          current.publication.revokedAt ?? current.publication.updatedAt,
      };
    }

    const revokedAt = new Date().toISOString();
    const publication: ProposalPublication = {
      ...current.publication,
      status: 'revoked',
      updatedAt: revokedAt,
      revokedAt,
    };
    this.proposals.set(id, {
      ...current,
      proposal: { ...current.proposal, status: 'lista' },
      publication,
      updatedAt: revokedAt,
    });

    return {
      proposalId: id,
      token: publication.token,
      status: 'revoked',
      revokedAt,
    };
  }

  private assertPublishable(proposal: ProposalSnapshot): void {
    const hasArea =
      proposal.areas &&
      Object.values(proposal.areas).some((selected) => selected === true);
    if (
      !this.isNonBlank(proposal.client?.company) ||
      !this.isNonBlank(proposal.client?.recipient) ||
      !this.isNonBlank(proposal.context) ||
      !this.isNonBlank(proposal.narrative?.headline) ||
      !this.isNonBlank(proposal.narrative?.valueStatement) ||
      !this.isNonBlank(proposal.narrative?.decision) ||
      !this.isNonBlank(proposal.scope) ||
      !this.isNonBlank(proposal.strategy) ||
      !this.isNonBlank(proposal.responsible) ||
      !this.isNonBlank(proposal.investment) ||
      !this.isNonBlank(proposal.conditions) ||
      !hasArea
    ) {
      throw new BadRequestException(
        'Complete empresa, destinatario, narrativa, contexto, alcance, estrategia, responsable, condiciones y al menos un área antes de publicar.',
      );
    }
  }

  private toPublicSnapshot(proposal: ProposalSnapshot): PublicProposalSnapshot {
    return {
      code: proposal.code,
      version: proposal.version,
      status: 'publicada',
      client: {
        company: proposal.client.company,
        recipient: proposal.client.recipient,
      },
      context: proposal.context,
      narrative: { ...proposal.narrative },
      areas: { ...proposal.areas },
      scope: proposal.scope,
      strategy: proposal.strategy,
      responsible: proposal.responsible,
      investment: proposal.investment,
      conditions: proposal.conditions,
    };
  }

  private findPublished(token: string): PublishedProposal {
    const current = [...this.proposals.values()].find(
      (stored) =>
        stored.publication?.token === token &&
        stored.publication.status === 'published',
    );

    if (!current?.publication || !current.publishedSnapshot) {
      throw new NotFoundException(
        'La experiencia compartida no existe o ya no está disponible.',
      );
    }

    return current as PublishedProposal;
  }

  private trackPublicAccess(current: PublishedProposal): PublishedProposal {
    const now = new Date().toISOString();
    const stored: PublishedProposal = {
      ...current,
      publication: {
        ...current.publication,
        viewCount: current.publication.viewCount + 1,
        lastViewedAt: now,
      },
    };
    this.proposals.set(current.id, stored);
    return stored;
  }

  private createPublicToken(): string {
    let token: string;
    do {
      token = randomBytes(24).toString('base64url');
    } while (
      [...this.proposals.values()].some(
        (stored) => stored.publication?.token === token,
      )
    );
    return token;
  }

  private toPublicationResult(stored: StoredProposal): PublicationResult {
    if (!stored.publication || stored.publication.status !== 'published') {
      throw new NotFoundException(
        'La propuesta no tiene una publicación activa.',
      );
    }

    return {
      proposalId: stored.id,
      token: stored.publication.token,
      path: `/p/${stored.publication.token}`,
      version: stored.publication.version,
      status: 'published',
      publishedAt: stored.publication.publishedAt,
    };
  }

  private toReportSnapshot(stored: PublishedProposal): ProposalSnapshot {
    return {
      ...stored.publishedSnapshot,
      id: stored.id,
      client: {
        ...stored.publishedSnapshot.client,
        email: '',
      },
    };
  }

  private async renderPdf(
    proposal: ProposalSnapshot,
  ): Promise<{ buffer: Buffer; filename: string }> {
    const report = getProposalReport(proposal, {
      cover: this.pdfPrinter.imageDataUri('cover-energia.png'),
      logo: this.pdfPrinter.imageDataUri('logo-er.png'),
      team: this.pdfPrinter.imageDataUri('equipo-editorial.jpg'),
    });
    const buffer = await this.pdfPrinter.render(report);
    return { buffer, filename: proposalPdfFileName(proposal) };
  }

  private isNonBlank(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
  }
}
