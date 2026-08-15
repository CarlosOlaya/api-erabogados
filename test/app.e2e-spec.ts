import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { createHash } from 'node:crypto';
import { DataType, newDb } from 'pg-mem';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from './../src/app.module';
import { CreateProposals1786420000000 } from './../src/database/migrations/1786420000000-CreateProposals';
import { CreateFirmProfiles1786500000000 } from './../src/database/migrations/1786500000000-CreateFirmProfiles';
import { AddProposalPublicationSlug1786600000000 } from './../src/database/migrations/1786600000000-AddProposalPublicationSlug';
import { RandomizePublicationSlug1786700000000 } from './../src/database/migrations/1786700000000-RandomizePublicationSlug';
import { FirmProfileEntity } from './../src/firma/firma.entity';
import { ProposalEntity } from './../src/propuestas/propuesta.entity';
import { ProposalVersionEntity } from './../src/propuestas/propuesta-version.entity';
import type {
  PublicationResult,
  DeletionResult,
  ProposalSnapshot,
  PublicProposalResult,
  RevocationResult,
  StoredProposal,
} from './../src/propuestas/propuesta.types';

const ADMIN_TOKEN = 'test-firm-token';

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
  clientLogos: ['grupo-cobra', 'veolia'],
});

describe('Propuestas (e2e)', () => {
  let app: INestApplication<App>;
  let database: DataSource;

  /**
   * Las rutas del estudio exigen la clave compartida. Las del portal del
   * cliente no: por eso las llamadas públicas de esta suite siguen usando
   * `request(...)` directamente.
   */
  const studio = () => {
    const server = app.getHttpServer() as App;
    const authorize = <T extends { set: (field: string, value: string) => T }>(
      test: T,
    ): T => test.set('Authorization', `Bearer ${ADMIN_TOKEN}`);

    return {
      get: (url: string) => authorize(request(server).get(url)),
      post: (url: string) => authorize(request(server).post(url)),
      patch: (url: string) => authorize(request(server).patch(url)),
      delete: (url: string) => authorize(request(server).delete(url)),
    };
  };

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
    // pg-mem trae muy pocas funciones nativas. Estas las usa la migración que
    // aleatoriza los slugs y existen de serie en el Postgres real.
    memoryDatabase.public.registerFunction({
      name: 'substr',
      args: [DataType.text, DataType.integer, DataType.integer],
      returns: DataType.text,
      implementation: (value: string, from: number, length: number) =>
        (value ?? '').substring(from - 1, from - 1 + length),
    });
    memoryDatabase.public.registerFunction({
      name: 'md5',
      args: [DataType.text],
      returns: DataType.text,
      implementation: (value: string) =>
        createHash('md5').update(value ?? '').digest('hex'),
    });
    memoryDatabase.public.registerFunction({
      name: 'random',
      returns: DataType.float,
      // `impure` evita que pg-mem memorice un único valor para toda la consulta.
      impure: true,
      implementation: () => Math.random(),
    });
    const memoryDataSource: unknown =
      memoryDatabase.adapters.createTypeormDataSource({
        type: 'postgres',
        entities: [ProposalEntity, ProposalVersionEntity, FirmProfileEntity],
        migrations: [
          CreateProposals1786420000000,
          CreateFirmProfiles1786500000000,
          AddProposalPublicationSlug1786600000000,
          RandomizePublicationSlug1786700000000,
        ],
        migrationsTableName: 'er_migrations',
        synchronize: false,
      });
    database = memoryDataSource as DataSource;
    await database.initialize();
    await database.runMigrations();

    process.env.ER_ADMIN_TOKEN = ADMIN_TOKEN;
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
    const created = await studio()
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

    const pdf = await studio()
      .get(`/propuestas/${stored.id}/pdf`)
      .expect(200)
      .expect('Content-Type', /application\/pdf/);

    expect(pdf.headers['content-disposition']).toContain('attachment;');
    expect(Number(pdf.headers['content-length'])).toBeGreaterThan(100_000);
  }, 20_000);

  it('publica una versión segura y entrega el resumen PDF desde ese snapshot', async () => {
    const created = await studio()
      .post('/propuestas')
      .send(proposalFixture())
      .expect(201);
    const stored = created.body as StoredProposal;

    const publishedResponse = await studio()
      .post(`/propuestas/${stored.id}/publicar`)
      .send({})
      .expect(201);
    const published = publishedResponse.body as PublicationResult;

    expect(published.proposalId).toBe(stored.id);
    expect(published.token).toMatch(/^[A-Za-z0-9_-]{32}$/);
    // El nombre sigue siendo legible, pero el sufijo aleatorio impide adivinarlo.
    expect(published.slug).toMatch(/^vertice-energia-[23456789bcdfghjkmnpqrstvwxz]{8}$/);
    expect(published.path).toBe(`/portal/${published.slug}`);
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
    // El snapshot público se arma campo por campo: si alguien agrega un campo
    // al modelo y olvida incluirlo aquí, el cliente nunca lo ve.
    expect(publicProposal.proposal.clientLogos).toEqual(['grupo-cobra', 'veolia']);

    const friendlyResponse = await request(app.getHttpServer())
      .get(`/propuestas/portales/${published.slug}`)
      .expect(200)
      .expect('Cache-Control', 'no-store')
      .expect('X-Robots-Tag', /noindex/);
    expect((friendlyResponse.body as PublicProposalResult).code).toBe(
      stored.code,
    );

    const pdf = await request(app.getHttpServer())
      .get(`/propuestas/publicas/${published.token}/pdf`)
      .expect(200)
      .expect('Content-Type', /application\/pdf/)
      .expect('Cache-Control', 'no-store')
      .expect('X-Robots-Tag', /noindex/);

    expect(pdf.headers['content-disposition']).toContain('attachment;');
    expect(Number(pdf.headers['content-length'])).toBeGreaterThan(100_000);

    // El cliente llega por el enlace legible y no conoce el token: el comité
    // debe poder descargar el PDF desde ahí.
    const pdfPorSlug = await request(app.getHttpServer())
      .get(`/propuestas/portales/${published.slug}/pdf`)
      .expect(200)
      .expect('Content-Type', /application\/pdf/)
      .expect('X-Robots-Tag', /noindex/);

    expect(pdfPorSlug.headers['content-disposition']).toContain('attachment;');
    expect(Number(pdfPorSlug.headers['content-length'])).toBeGreaterThan(100_000);
  }, 20_000);

  it('mantiene el enlace estable y el snapshot congelado hasta republicar', async () => {
    const original = proposalFixture();
    const createdResponse = await studio()
      .post('/propuestas')
      .send(original)
      .expect(201);
    const stored = createdResponse.body as StoredProposal;

    const firstPublishResponse = await studio()
      .post(`/propuestas/${stored.id}/publicar`)
      .send({})
      .expect(201);
    const firstPublication = firstPublishResponse.body as PublicationResult;

    const idempotentResponse = await studio()
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
    const updatedResponse = await studio()
      .patch(`/propuestas/${stored.id}`)
      .send(changed)
      .expect(200);
    const updated = updatedResponse.body as StoredProposal;
    expect(updated.proposal.version).toBe(2);
    expect(updated.proposal.status).toBe('lista');

    const savedAgainResponse = await studio()
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

    const secondPublishResponse = await studio()
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
    const createdResponse = await studio()
      .post('/propuestas')
      .send(proposalFixture())
      .expect(201);
    const stored = createdResponse.body as StoredProposal;
    const publishedResponse = await studio()
      .post(`/propuestas/${stored.id}/publicar`)
      .send({})
      .expect(201);
    const published = publishedResponse.body as PublicationResult;

    const revokedResponse = await studio()
      .delete(`/propuestas/${stored.id}/publicacion`)
      .expect(200);
    const revoked = revokedResponse.body as RevocationResult;
    expect(revoked.proposalId).toBe(stored.id);
    expect(revoked.token).toBe(published.token);
    expect(revoked.status).toBe('revoked');
    expect(typeof revoked.revokedAt).toBe('string');

    const repeatedResponse = await studio()
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

  it('resuelve colisiones de URL y permite eliminar una propuesta completa', async () => {
    const repeatedCompany = {
      ...proposalFixture(),
      client: {
        ...proposalFixture().client,
        company: 'Cliente Repetido S.A.S.',
      },
    };
    const first = (
      await studio()
        .post('/propuestas')
        .send(repeatedCompany)
        .expect(201)
    ).body as StoredProposal;
    const second = (
      await studio()
        .post('/propuestas')
        .send(repeatedCompany)
        .expect(201)
    ).body as StoredProposal;

    const firstPublication = (
      await studio()
        .post(`/propuestas/${first.id}/publicar`)
        .send({})
        .expect(201)
    ).body as PublicationResult;
    const secondPublication = (
      await studio()
        .post(`/propuestas/${second.id}/publicar`)
        .send({})
        .expect(201)
    ).body as PublicationResult;

    // Dos propuestas a la misma empresa comparten el nombre pero nunca el enlace.
    expect(firstPublication.slug).toMatch(/^cliente-repetido-[23456789bcdfghjkmnpqrstvwxz]{8}$/);
    expect(secondPublication.slug).toMatch(/^cliente-repetido-[23456789bcdfghjkmnpqrstvwxz]{8}$/);
    expect(secondPublication.slug).not.toBe(firstPublication.slug);

    const deletion = (
      await studio()
        .delete(`/propuestas/${second.id}`)
        .expect(200)
    ).body as DeletionResult;
    expect(deletion).toEqual({ proposalId: second.id, status: 'deleted' });
    await studio()
      .get(`/propuestas/${second.id}`)
      .expect(404);
    await request(app.getHttpServer())
      .get(`/propuestas/portales/${secondPublication.slug}`)
      .expect(404);
  });

  it('responde 400 al publicar un borrador incompleto en vez de producir un error interno', async () => {
    const createdResponse = await studio()
      .post('/propuestas')
      .send({})
      .expect(201);
    const stored = createdResponse.body as StoredProposal;

    const response = await studio()
      .post(`/propuestas/${stored.id}/publicar`)
      .send({})
      .expect(400);

    const error = response.body as { message: string };
    expect(error.message).toContain('Complete empresa');
  });

  it('cierra el estudio a quien no trae la clave y deja abierto el portal', async () => {
    const server = app.getHttpServer();

    // Sin clave: nada de la cartera es accesible.
    await request(server).get('/propuestas').expect(401);
    await request(server).post('/propuestas').send(proposalFixture()).expect(401);

    // Con una clave equivocada tampoco.
    await request(server)
      .get('/propuestas')
      .set('Authorization', 'Bearer clave-incorrecta')
      .expect(401);

    // El cliente abre su portal sin clave alguna.
    const stored = (
      await studio().post('/propuestas').send(proposalFixture()).expect(201)
    ).body as StoredProposal;
    const published = (
      await studio().post(`/propuestas/${stored.id}/publicar`).send({}).expect(201)
    ).body as PublicationResult;

    await request(server).get(`/propuestas/portales/${published.slug}`).expect(200);
    await request(server).get(`/propuestas/publicas/${published.token}`).expect(200);

    // Y borrar sigue exigiendo la clave.
    await request(server).delete(`/propuestas/${stored.id}`).expect(401);
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

  it('centraliza el perfil corporativo y protege su actualización', async () => {
    const currentResponse = await request(app.getHttpServer())
      .get('/firma/perfil')
      .expect(200)
      .expect('Cache-Control', 'no-store');
    const current = currentResponse.body as {
      version: number;
      updatedAt: string;
      identity: { name: string };
      team: Array<{ id: string }>;
      metrics: Array<{ publicable: boolean; value: string | null }>;
    };

    expect(current.identity.name).toBe('ER Abogados');
    expect(current.team).toHaveLength(8);
    expect(
      current.metrics.every(
        (metric) => !metric.publicable && metric.value === null,
      ),
    ).toBe(true);
    expect(typeof current.updatedAt).toBe('string');

    await request(app.getHttpServer())
      .put('/firma/perfil')
      .send(current)
      .expect(401);

    const unsupportedMetric = {
      ...current,
      metrics: [
        {
          id: 'resultados-favorables',
          label: 'Resultados favorables',
          value: '91%',
          evidence: null,
          validatedAt: null,
          publicable: true,
        },
      ],
    };
    await request(app.getHttpServer())
      .put('/firma/perfil')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send(unsupportedMetric)
      .expect(400);

    const next = {
      ...current,
      identity: { ...current.identity, name: 'ER Abogados Actualizado' },
    };
    const updatedResponse = await request(app.getHttpServer())
      .put('/firma/perfil')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send(next)
      .expect(200);
    const updated = updatedResponse.body as typeof current;

    expect(updated.version).toBe(current.version + 1);
    expect(updated.identity.name).toBe('ER Abogados Actualizado');
  });

  afterAll(async () => {
    await app.close();
    delete process.env.ER_ADMIN_TOKEN;
  });
});
