import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes, randomUUID } from 'node:crypto';
import { DataSource, Repository } from 'typeorm';
import { PdfPrinterService } from '../common/pdf-printer.service';
import { PortalNotifier } from './portal-notifier.service';
import { ProposalEntity } from './propuesta.entity';
import { ProposalVersionEntity } from './propuesta-version.entity';
import { getProposalReport, proposalPdfFileName } from './proposal-report';
import {
  type ProposalPublication,
  type DeletionResult,
  type ProposalSnapshot,
  type PublicationResult,
  type PublicProposalResult,
  type PublicProposalSnapshot,
  type RevocationResult,
  type StoredProposal,
} from './propuesta.types';

type PublishedProposal = StoredProposal & {
  publication: ProposalPublication & { status: 'published' };
  publishedSnapshot: PublicProposalSnapshot;
};

/** Longitud máxima del nombre normalizado dentro de `varchar(96)`. */
const SLUG_BASE_MAX = 80;

@Injectable()
export class PropuestasService {
  constructor(
    @InjectRepository(ProposalEntity)
    private readonly proposals: Repository<ProposalEntity>,
    private readonly database: DataSource,
    private readonly pdfPrinter: PdfPrinterService,
    private readonly notifier: PortalNotifier,
  ) {}

  async findAll(): Promise<StoredProposal[]> {
    const proposals = await this.proposals.find({
      order: { updatedAt: 'DESC' },
    });
    for (const proposal of proposals) {
      await this.ensurePublicationSlug(proposal);
    }
    return proposals.map((proposal) => this.toStored(proposal));
  }

  async findOne(id: string): Promise<StoredProposal> {
    const proposal = await this.findOneEntity(id);
    await this.ensurePublicationSlug(proposal);
    return this.toStored(proposal);
  }

  async create(input: ProposalSnapshot): Promise<StoredProposal> {
    const id = randomUUID();
    const proposal = this.normalizeProposal(input, {
      id,
      code: '',
      version: Math.max(1, input.version || 1),
      status: 'borrador',
    });

    return this.database.transaction(async (manager) => {
      const repository = manager.getRepository(ProposalEntity);
      let entity = repository.create({
        id,
        code: null,
        proposal,
        publishedSnapshot: null,
        publicationToken: null,
        publicationSlug: null,
        publicationStatus: null,
        publicationVersion: null,
        publishedAt: null,
        publicationUpdatedAt: null,
        viewCount: 0,
        lastViewedAt: null,
        revokedAt: null,
      });
      entity = await repository.save(entity);

      const [{ sequence_id: sequenceId }] = await repository.query<
        Array<{ sequence_id: string }>
      >('SELECT "sequence_id" FROM "proposals" WHERE "id" = $1', [id]);
      const code = `ER-PROP-${String(sequenceId).padStart(4, '0')}`;
      entity.sequenceId = sequenceId;
      entity.code = code;
      entity.proposal = { ...entity.proposal, code };
      return this.toStored(await repository.save(entity));
    });
  }

  async update(id: string, input: ProposalSnapshot): Promise<StoredProposal> {
    const entity = await this.findOneEntity(id);
    const publication = this.toStored(entity).publication;
    const version = publication
      ? Math.max(entity.proposal.version, publication.version + 1)
      : entity.proposal.version;

    entity.proposal = this.normalizeProposal(input, {
      id,
      code: this.requireCode(entity),
      version,
      status: 'lista',
    });
    entity.updatedAt = new Date();
    return this.toStored(await this.proposals.save(entity));
  }

  async pdf(id: string): Promise<{ buffer: Buffer; filename: string }> {
    const stored = await this.findOne(id);
    return this.renderPdf(stored.proposal);
  }

  async publish(id: string): Promise<PublicationResult> {
    return this.database.transaction(async (manager) => {
      const proposals = manager.getRepository(ProposalEntity);
      const versions = manager.getRepository(ProposalVersionEntity);
      const entity = await this.findOneEntity(id, proposals);
      const current = this.toStored(entity);
      this.assertPublishable(current.proposal);

      if (
        current.publication?.status === 'published' &&
        current.publication.version === current.proposal.version &&
        current.publishedSnapshot &&
        entity.publicationSlug
      ) {
        return this.toPublicationResult(current);
      }

      const now = new Date();
      const token =
        entity.publicationToken ?? (await this.createPublicToken(proposals));
      const slug =
        entity.publicationSlug ??
        (await this.createPublicSlug(
          entity.proposal.client.company,
          proposals,
        ));
      entity.proposal = { ...current.proposal, status: 'publicada' };
      entity.publishedSnapshot = this.toPublicSnapshot(entity.proposal);
      entity.publicationToken = token;
      entity.publicationSlug = slug;
      entity.publicationVersion = entity.proposal.version;
      entity.publicationStatus = 'published';
      entity.publishedAt = now;
      entity.publicationUpdatedAt = now;
      entity.revokedAt = null;
      entity.updatedAt = now;

      const saved = await proposals.save(entity);
      const versionExists = await versions.exists({
        where: { proposalId: id, version: entity.proposal.version },
      });
      if (!versionExists) {
        await versions.insert({
          id: randomUUID(),
          proposalId: id,
          version: entity.proposal.version,
          snapshot: entity.publishedSnapshot,
          publishedAt: now,
        });
      }

      return this.toPublicationResult(this.toStored(saved));
    });
  }

  async findPublic(
    token: string,
    internal = false,
  ): Promise<PublicProposalResult> {
    const current = await this.trackPublicAccess(
      await this.findPublished(token),
      internal,
    );

    return {
      code: current.code,
      version: current.publication.version,
      publishedAt: current.publication.publishedAt,
      proposal: current.publishedSnapshot,
    };
  }

  async findPublicBySlug(
    slug: string,
    internal = false,
  ): Promise<PublicProposalResult> {
    const current = await this.trackPublicAccess(
      await this.findPublishedBySlug(slug),
      internal,
    );

    return {
      code: current.code,
      version: current.publication.version,
      publishedAt: current.publication.publishedAt,
      proposal: current.publishedSnapshot,
    };
  }

  async remove(id: string): Promise<DeletionResult> {
    const entity = await this.findOneEntity(id);
    await this.proposals.remove(entity);
    return { proposalId: id, status: 'deleted' };
  }

  async publicPdf(
    token: string,
  ): Promise<{ buffer: Buffer; filename: string }> {
    const current = await this.trackPublicAccess(
      await this.findPublished(token),
    );
    return this.renderPdf(this.toReportSnapshot(current));
  }

  /**
   * El cliente que abre el portal por su enlace legible no conoce el token, y
   * los comités siguen decidiendo sobre un PDF. Sin esta ruta, reenviar la
   * propuesta al formato que la organización realmente usa era imposible.
   */
  async publicPdfBySlug(
    slug: string,
  ): Promise<{ buffer: Buffer; filename: string }> {
    const current = await this.trackPublicAccess(
      await this.findPublishedBySlug(slug),
    );
    return this.renderPdf(this.toReportSnapshot(current));
  }

  async revoke(id: string): Promise<RevocationResult> {
    const entity = await this.findOneEntity(id);
    const current = this.toStored(entity);
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

    const revokedAt = new Date();
    entity.proposal = { ...entity.proposal, status: 'lista' };
    entity.publicationStatus = 'revoked';
    entity.publicationUpdatedAt = revokedAt;
    entity.revokedAt = revokedAt;
    entity.updatedAt = revokedAt;
    const stored = this.toStored(await this.proposals.save(entity));

    return {
      proposalId: id,
      token: stored.publication!.token,
      status: 'revoked',
      revokedAt: stored.publication!.revokedAt!,
    };
  }

  private async findOneEntity(
    id: string,
    repository: Repository<ProposalEntity> = this.proposals,
  ): Promise<ProposalEntity> {
    const proposal = await repository.findOne({ where: { id } });
    if (!proposal) {
      throw new NotFoundException('La propuesta solicitada no existe.');
    }
    return proposal;
  }

  private normalizeProposal(
    input: ProposalSnapshot,
    identity: Pick<ProposalSnapshot, 'id' | 'code' | 'version' | 'status'>,
  ): ProposalSnapshot {
    return {
      ...input,
      includeInvestment: input.includeInvestment ?? true,
      investment: input.investment || 'A convenir',
      includeAdditionalValue: input.includeAdditionalValue ?? false,
      additionalValueLabel: input.additionalValueLabel || 'Valor adicional',
      additionalValue: input.additionalValue || '',
      ...identity,
    };
  }

  private toStored(entity: ProposalEntity): StoredProposal {
    const code = this.requireCode(entity);
    const hasPublication =
      entity.publicationToken &&
      entity.publicationStatus &&
      entity.publicationVersion !== null &&
      entity.publishedAt &&
      entity.publicationUpdatedAt;
    const publication: ProposalPublication | undefined = hasPublication
      ? {
          token: entity.publicationToken!,
          slug: entity.publicationSlug ?? undefined,
          version: entity.publicationVersion!,
          status: entity.publicationStatus!,
          publishedAt: entity.publishedAt!.toISOString(),
          updatedAt: entity.publicationUpdatedAt!.toISOString(),
          viewCount: entity.viewCount,
          lastViewedAt: entity.lastViewedAt?.toISOString(),
          revokedAt: entity.revokedAt?.toISOString(),
        }
      : undefined;

    return {
      id: entity.id,
      code,
      proposal: { ...entity.proposal, id: entity.id, code },
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
      publication,
      publishedSnapshot: entity.publishedSnapshot ?? undefined,
    };
  }

  private requireCode(entity: ProposalEntity): string {
    if (!entity.code) {
      throw new Error(`La propuesta ${entity.id} no tiene código asignado.`);
    }
    return entity.code;
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
      !this.isNonBlank(proposal.narrative?.decision) ||
      !this.isNonBlank(proposal.scope) ||
      !this.isNonBlank(proposal.strategy) ||
      !this.isNonBlank(proposal.responsible) ||
      ((proposal.includeInvestment ?? true) &&
        !this.isNonBlank(proposal.investment)) ||
      ((proposal.includeAdditionalValue ?? false) &&
        (!this.isNonBlank(proposal.additionalValueLabel) ||
          !this.isNonBlank(proposal.additionalValue))) ||
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
      includeInvestment: proposal.includeInvestment ?? true,
      investment: proposal.investment,
      includeAdditionalValue: proposal.includeAdditionalValue ?? false,
      additionalValueLabel: proposal.additionalValueLabel || 'Valor adicional',
      additionalValue: proposal.additionalValue || '',
      conditions: proposal.conditions,
      // El snapshot se arma campo por campo: sin esta línea los clientes
      // elegidos como respaldo no llegarían nunca al portal publicado.
      clientLogos: proposal.clientLogos ?? [],
    };
  }

  private async findPublished(token: string): Promise<PublishedProposal> {
    const entity = await this.proposals.findOne({
      where: { publicationToken: token, publicationStatus: 'published' },
    });
    const current = entity ? this.toStored(entity) : undefined;

    if (!current?.publication || !current.publishedSnapshot) {
      throw new NotFoundException(
        'La experiencia compartida no existe o ya no está disponible.',
      );
    }

    return current as PublishedProposal;
  }

  private async findPublishedBySlug(slug: string): Promise<PublishedProposal> {
    const entity = await this.proposals.findOne({
      where: { publicationSlug: slug, publicationStatus: 'published' },
    });
    const current = entity ? this.toStored(entity) : undefined;

    if (!current?.publication || !current.publishedSnapshot) {
      throw new NotFoundException(
        'La experiencia compartida no existe o ya no está disponible.',
      );
    }

    return current as PublishedProposal;
  }

  /**
   * `internal` marca las aperturas del propio equipo desde el estudio. Antes
   * se contaban igual que las del cliente, así que el número que servía para
   * decidir cuándo llamar estaba contaminado desde la primera propuesta.
   */
  private async trackPublicAccess(
    current: PublishedProposal,
    internal = false,
  ): Promise<PublishedProposal> {
    if (internal) return current;

    const now = new Date();
    const previousViewAt = current.publication.lastViewedAt
      ? new Date(current.publication.lastViewedAt)
      : null;
    const viewCount = current.publication.viewCount + 1;

    await this.proposals.increment({ id: current.id }, 'viewCount', 1);
    await this.proposals.update({ id: current.id }, { lastViewedAt: now });

    if (this.notifier.shouldNotify(previousViewAt)) {
      this.notifier.notify({
        company: current.proposal.client.company,
        recipient: current.proposal.client.recipient,
        code: current.code,
        version: current.publication.version,
        viewCount,
        isFirstView: !previousViewAt,
      });
    }

    return {
      ...current,
      publication: {
        ...current.publication,
        viewCount,
        lastViewedAt: now.toISOString(),
      },
    };
  }

  private async createPublicToken(
    repository: Repository<ProposalEntity> = this.proposals,
  ): Promise<string> {
    let token: string;
    do {
      token = randomBytes(24).toString('base64url');
    } while (await repository.exists({ where: { publicationToken: token } }));
    return token;
  }

  /** El enlace del portal conserva un nombre de empresa legible al compartirlo. */
  private async createPublicSlug(
    company: string,
    repository: Repository<ProposalEntity> = this.proposals,
  ): Promise<string> {
    const normalizedCompany = company
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-(?:s-a-s|sas|s-a|sa|ltda|limitada)$/g, '')
      .slice(0, SLUG_BASE_MAX);
    const base = normalizedCompany || 'propuesta';

    if (!(await repository.exists({ where: { publicationSlug: base } }))) {
      return base;
    }

    let suffix = 2;
    let slug = `${base}-${suffix}`;
    while (await repository.exists({ where: { publicationSlug: slug } })) {
      suffix += 1;
      slug = `${base}-${suffix}`;
    }
    return slug;
  }

  private async ensurePublicationSlug(entity: ProposalEntity): Promise<void> {
    if (!entity.publicationToken || entity.publicationSlug) return;
    entity.publicationSlug = await this.createPublicSlug(
      entity.proposal.client.company,
    );
    await this.proposals.save(entity);
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
      slug: stored.publication.slug!,
      path: `/portal/${stored.publication.slug}`,
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
