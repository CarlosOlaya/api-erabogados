import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { INITIAL_FIRM_PROFILE } from './firma.seed';
import { FirmProfileEntity } from './firma.entity';
import type { FirmProfileInput, PublicFirmProfile } from './firma.types';

const PROFILE_ID = 'corporate';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const hasString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

@Injectable()
export class FirmaService implements OnModuleInit {
  constructor(
    @InjectRepository(FirmProfileEntity)
    private readonly profiles: Repository<FirmProfileEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    const existing = await this.profiles.findOneBy({ id: PROFILE_ID });
    if (existing) return;

    await this.profiles.save({
      id: PROFILE_ID,
      version: 1,
      profile: structuredClone(INITIAL_FIRM_PROFILE),
    });
  }

  async getPublicProfile(): Promise<PublicFirmProfile> {
    return this.toPublic(await this.requireProfile());
  }

  async updateProfile(input: unknown): Promise<PublicFirmProfile> {
    if (!isRecord(input)) {
      throw new BadRequestException('El registro corporativo debe ser un objeto JSON.');
    }
    const { version: _version, updatedAt: _updatedAt, ...profileInput } = input;
    this.assertProfile(profileInput);
    const current = await this.requireProfile();
    const saved = await this.profiles.save({
      ...current,
      version: current.version + 1,
      profile: structuredClone(profileInput),
    });

    await this.triggerConsumerDeploys();
    return this.toPublic(saved);
  }

  private async requireProfile(): Promise<FirmProfileEntity> {
    const profile = await this.profiles.findOneBy({ id: PROFILE_ID });
    if (profile) return profile;

    const seeded = this.profiles.create({
      id: PROFILE_ID,
      version: 1,
      profile: structuredClone(INITIAL_FIRM_PROFILE),
    });
    return this.profiles.save(seeded);
  }

  private toPublic(profile: FirmProfileEntity): PublicFirmProfile {
    return {
      ...structuredClone(profile.profile),
      version: profile.version,
      updatedAt: profile.updatedAt.toISOString(),
    };
  }

  private assertProfile(input: unknown): asserts input is FirmProfileInput {
    if (!isRecord(input) || input.schemaVersion !== 1) {
      throw new BadRequestException('El registro corporativo no tiene una versión de esquema válida.');
    }

    if (!isRecord(input.identity) || !hasString(input.identity.name) || !hasString(input.identity.legalName)) {
      throw new BadRequestException('Complete la identidad corporativa antes de guardar.');
    }

    if (!isRecord(input.contact) || !hasString(input.contact.email) || !hasString(input.contact.phone)) {
      throw new BadRequestException('Complete los datos de contacto antes de guardar.');
    }

    const collections = ['practiceAreas', 'team', 'metrics', 'testimonials'] as const;
    for (const field of collections) {
      if (!Array.isArray(input[field])) {
        throw new BadRequestException(`El campo ${field} debe ser una lista.`);
      }
    }

    const team = input.team as unknown[];
    const practiceAreas = input.practiceAreas as unknown[];
    const metrics = input.metrics as unknown[];

    const ids = new Set<string>();
    for (const member of team) {
      if (!isRecord(member) || !hasString(member.id) || !hasString(member.name) || !hasString(member.imageKey)) {
        throw new BadRequestException('Cada perfil requiere id, nombre e imageKey.');
      }
      if (ids.has(member.id)) throw new BadRequestException(`El perfil ${member.id} está duplicado.`);
      ids.add(member.id);
    }

    const areaIds = new Set<string>();
    for (const area of practiceAreas) {
      if (!isRecord(area) || !hasString(area.id) || !hasString(area.number) || !hasString(area.title)) {
        throw new BadRequestException('Cada área requiere id, número y título.');
      }
      if (areaIds.has(area.id)) throw new BadRequestException(`El área ${area.id} está duplicada.`);
      areaIds.add(area.id);
    }

    for (const metric of metrics) {
      if (!isRecord(metric) || !hasString(metric.id) || !hasString(metric.label)) {
        throw new BadRequestException('Cada métrica requiere id y etiqueta.');
      }
      if (
        metric.publicable === true &&
        (!hasString(metric.value) || !hasString(metric.evidence) || !hasString(metric.validatedAt))
      ) {
        throw new BadRequestException(
          `La métrica ${metric.id} requiere valor, evidencia y fecha de validación para publicarse.`,
        );
      }
    }
  }

  private async triggerConsumerDeploys(): Promise<void> {
    const hooks = [
      { name: 'landing', url: process.env.LANDING_DEPLOY_HOOK?.trim() },
      { name: 'portal', url: process.env.PORTAL_DEPLOY_HOOK?.trim() },
    ].filter((hook): hook is { name: string; url: string } => Boolean(hook.url));

    await Promise.all(
      hooks.map(async (hook) => {
        try {
          const response = await fetch(hook.url, { method: 'POST' });
          if (!response.ok) {
            console.error(`No fue posible solicitar la compilación de ${hook.name}: ${response.status}.`);
          }
        } catch (error) {
          console.error(`No fue posible solicitar la compilación de ${hook.name}.`, error);
        }
      }),
    );
  }
}
