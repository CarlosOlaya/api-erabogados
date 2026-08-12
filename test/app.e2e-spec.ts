import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { newDb } from 'pg-mem';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from './../src/app.module';
import { CreateProposals1786420000000 } from './../src/database/migrations/1786420000000-CreateProposals';
import { ProposalEntity } from './../src/propuestas/propuesta.entity';
import { ProposalVersionEntity } from './../src/propuestas/propuesta-version.entity';
import type {
  PublicationResult,
  ProposalSnapshot,
  PublicProposalResult,
  RevocationResult,
  StoredProposal,
} from './../src/propuestas/propuesta.types';

const proposalFixture = (): ProposalSnapshot => ({
  id: '',
  code: 'ER-PROP-0001',
  version: 1,
  status: 'borrador',
  client: {
    company: 'Vértice Energía S.A.S.',
    recipient: 'Gerencia General',
    email: 'gerencia@vertice.example',
  },
  context:
    'Acompañamiento preventivo y contractual para una operación de energía.',
  narrative: {
    headline: 'Una ruta jurídica para avanzar con control y continuidad.',
    valueStatement:
      'Integramos las decisiones jurídicas que sostienen la operación y reducen exposición.',
    decision:
      'Priorizar riesgos, responsables y decisiones críticas para la dirección.',
  },
  areas: {
    civil: false,
    'responsabilidad-civil': false,
    seguros: true,
    contractual: true,
    'responsabilidad-estado': false,
    'responsabilidad-fiscal': false,
    tributario: false,
    inmobiliario: false,
    laboral: false,
    corporativo: false,
  },
  scope: 'Estudio inicial, priorización y ruta jurídica aplicable.',
  strategy:
    'Interlocución directa y reportes claros para la toma de decisiones.',
  responsible: 'Equipo ER Abogados',
  includeInvestment: true,
  investment: 'Según alcance y modalidad de acompañamiento.',
  includeAdditionalValue: false,
  additionalValueLabel: 'Valor adicional',
  additionalValue: '',
  conditions: 'El alcance definitivo se acuerda por escrito antes del inicio.',
});

describe('Propuestas (e2e)', () => {
  let app: INestApplication<App>;
  let database: DataSource;

  beforeAll(async () => {
    const memoryDatabase = newDb({ autoCreateForeignKeyIndices: true });
    memoryDatabase.public.registerFunction({
      name: 'current_database',
      implementation: () => 'erabogados_test',
    });
    memoryDatabase.public.registerFunction({
      name: 'version',
      implementation: () => 'PostgreSQL 16 test',
    });
    const memoryDataSource: unknown =
      memoryDatabase.adapters.createTypeormDataSource({
        type: 'postgres',
        entities: [ProposalEntity, ProposalVersionEntity],
        migrations: [CreateProposals1786420000000],
        migrationsTableName: 'er_migrations',
        synchronize: false,
      });
    database = memoryDataSource as DataSource;
    await database.initialize();
    await database.runMigrations();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(getDataSourceToken())
      .useValue(database)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('guarda un snapshot y entrega su PDF interno', async () => {
    const created = await request(app.getHttpServer())
      .post('/propuestas')
      .send(proposalFixture())
      .expect(201);
    const stored = created.body as StoredProposal;

    expect(typeof stored.id).toBe('string');
    expect(stored.id).not.toHaveLength(0);
    expect(stored.code).toBe('ER-PROP-0001');

    const persisted = await database.getRepository(ProposalEntity).findOneBy({
      id: stored.id,
    });
    expect(persisted?.proposal.client.company).toBe('Vértice Energía S.A.S.');

    const pdf = await request(app.getHttpServer())
      .get(`/propuestas/${stored.id}/pdf`)
      .expect(200)
      .expect('Content-Type', /application\/pdf/);

    expect(pdf.headers['content-disposition']).toContain('attachment;');
    expect(Number(pdf.headers['content-length'])).toBeGreaterThan(100_000);
  }, 20_000);

  it('publica una versión segura y entrega el resumen PDF desde ese snapshot', async () => {
    const created = await request(app.getHttpServer())
      .post('/propuestas')
      .send(proposalFixture())
      .expect(201);
    const stored = created.body as StoredProposal;

    const publishedResponse = await request(app.getHttpServer())
      .post(`/propuestas/${stored.id}/publicar`)
      .send({})
      .expect(201);
    const published = publishedResponse.body as PublicationResult;

    expect(published.proposalId).toBe(stored.id);
    expect(published.token).toMatch(/^[A-Za-z0-9_-]{32}$/);
    expect(published.path).toMatch(/^\/p\/[A-Za-z0-9_-]{32}$/);
    expect(published.version).toBe(1);
    expect(published.status).toBe('published');
    expect(typeof published.publishedAt).toBe('string');

    const publicResponse = await request(app.getHttpServer())
      .get(`/propuestas/publicas/${published.token}`)
      .expect(200)
      .expect('Cache-Control', 'no-store')
      .expect('X-Robots-Tag', /noindex/);
    const publicProposal = publicResponse.body as PublicProposalResult;

    expect(publicProposal.version).toBe(1);
    expect(publicProposal.proposal.client).toEqual({
      company: 'Vértice Energía S.A.S.',
      recipient: 'Gerencia General',
    });
    expect(publicProposal.proposal).not.toHaveProperty('id');
    expect(publicProposal.proposal.client).not.toHaveProperty('email');

    const pdf = await request(app.getHttpServer())
      .get(`/propuestas/publicas/${published.token}/pdf`)
      .expect(200)
      .expect('Content-Type', /application\/pdf/)
      .expect('Cache-Control', 'no-store')
      .expect('X-Robots-Tag', /noindex/);

    expect(pdf.headers['content-disposition']).toContain('attachment;');
    expect(Number(pdf.headers['content-length'])).toBeGreaterThan(100_000);
  }, 20_000);

  it('mantiene el enlace estable y el snapshot congelado hasta republicar', async () => {
    const original = proposalFixture();
    const createdResponse = await request(app.getHttpServer())
      .post('/propuestas')
      .send(original)
      .expect(201);
    const stored = createdResponse.body as StoredProposal;

    const firstPublishResponse = await request(app.getHttpServer())
      .post(`/propuestas/${stored.id}/publicar`)
      .send({})
      .expect(201);
    const firstPublication = firstPublishResponse.body as PublicationResult;

    const idempotentResponse = await request(app.getHttpServer())
      .post(`/propuestas/${stored.id}/publicar`)
      .send({})
      .expect(201);
    expect(idempotentResponse.body).toEqual(firstPublication);

    const changed: ProposalSnapshot = {
      ...original,
      id: stored.id,
      code: stored.code,
      narrative: {
        ...original.narrative,
        headline: 'Nueva versión aprobada por el comité directivo.',
      },
    };
    const updatedResponse = await request(app.getHttpServer())
      .patch(`/propuestas/${stored.id}`)
      .send(changed)
      .expect(200);
    const updated = updatedResponse.body as StoredProposal;
    expect(updated.proposal.version).toBe(2);
    expect(updated.proposal.status).toBe('lista');

    const savedAgainResponse = await request(app.getHttpServer())
      .patch(`/propuestas/${stored.id}`)
      .send({
        ...changed,
        narrative: {
          ...changed.narrative,
          valueStatement: 'Segundo guardado de la misma revisión interna.',
        },
      })
      .expect(200);
    const savedAgain = savedAgainResponse.body as StoredProposal;
    expect(savedAgain.proposal.version).toBe(2);

    const beforeRepublishResponse = await request(app.getHttpServer())
      .get(`/propuestas/publicas/${firstPublication.token}`)
      .expect(200);
    const beforeRepublish =
      beforeRepublishResponse.body as PublicProposalResult;
    expect(beforeRepublish.version).toBe(1);
    expect(beforeRepublish.proposal.narrative.headline).toBe(
      original.narrative.headline,
    );

    const secondPublishResponse = await request(app.getHttpServer())
      .post(`/propuestas/${stored.id}/publicar`)
      .send({})
      .expect(201);
    const secondPublication = secondPublishResponse.body as PublicationResult;
    expect(secondPublication.token).toBe(firstPublication.token);
    expect(secondPublication.path).toBe(firstPublication.path);
    expect(secondPublication.version).toBe(2);

    const afterRepublishResponse = await request(app.getHttpServer())
      .get(`/propuestas/publicas/${firstPublication.token}`)
      .expect(200);
    const afterRepublish = afterRepublishResponse.body as PublicProposalResult;
    expect(afterRepublish.version).toBe(2);
    expect(afterRepublish.proposal.narrative.headline).toBe(
      'Nueva versión aprobada por el comité directivo.',
    );

    const versionHistory = await database
      .getRepository(ProposalVersionEntity)
      .find({
        where: { proposalId: stored.id },
        order: { version: 'ASC' },
      });
    expect(versionHistory.map((record) => record.version)).toEqual([1, 2]);
    expect(versionHistory[0].snapshot.narrative.headline).toBe(
      original.narrative.headline,
    );
    expect(versionHistory[1].snapshot.narrative.headline).toBe(
      'Nueva versión aprobada por el comité directivo.',
    );
  });

  it('revoca el acceso público de forma idempotente', async () => {
    const createdResponse = await request(app.getHttpServer())
      .post('/propuestas')
      .send(proposalFixture())
      .expect(201);
    const stored = createdResponse.body as StoredProposal;
    const publishedResponse = await request(app.getHttpServer())
      .post(`/propuestas/${stored.id}/publicar`)
      .send({})
      .expect(201);
    const published = publishedResponse.body as PublicationResult;

    const revokedResponse = await request(app.getHttpServer())
      .delete(`/propuestas/${stored.id}/publicacion`)
      .expect(200);
    const revoked = revokedResponse.body as RevocationResult;
    expect(revoked.proposalId).toBe(stored.id);
    expect(revoked.token).toBe(published.token);
    expect(revoked.status).toBe('revoked');
    expect(typeof revoked.revokedAt).toBe('string');

    const repeatedResponse = await request(app.getHttpServer())
      .delete(`/propuestas/${stored.id}/publicacion`)
      .expect(200);
    expect(repeatedResponse.body as RevocationResult).toEqual(revoked);

    await request(app.getHttpServer())
      .get(`/propuestas/publicas/${published.token}`)
      .expect(404);
    await request(app.getHttpServer())
      .get(`/propuestas/publicas/${published.token}/pdf`)
      .expect(404);
  });

  it('responde 400 al publicar un borrador incompleto en vez de producir un error interno', async () => {
    const createdResponse = await request(app.getHttpServer())
      .post('/propuestas')
      .send({})
      .expect(201);
    const stored = createdResponse.body as StoredProposal;

    const response = await request(app.getHttpServer())
      .post(`/propuestas/${stored.id}/publicar`)
      .send({})
      .expect(400);

    const error = response.body as { message: string };
    expect(error.message).toContain('Complete empresa');
  });

  it('expone un control de salud para Railway', async () => {
    const response = await request(app.getHttpServer())
      .get('/health')
      .expect(200);

    expect(response.body).toMatchObject({
      status: 'ok',
      service: 'api-erabogados',
      database: 'connected',
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
