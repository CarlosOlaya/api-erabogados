import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import type { ProposalSnapshot } from './../src/propuestas/propuesta.types';

describe('Propuestas (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('guarda un snapshot y entrega su PDF', async () => {
    const proposal: ProposalSnapshot = {
      id: '',
      code: 'ER-PROP-0001',
      version: 1,
      status: 'borrador',
      client: {
        company: 'Vértice Energía S.A.S.',
        recipient: 'Gerencia General',
        email: '',
      },
      context: 'Acompañamiento preventivo y contractual para una operación de energía.',
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
      strategy: 'Interlocución directa y reportes claros para la toma de decisiones.',
      responsible: 'Equipo ER Abogados',
      investment: 'Según alcance y modalidad de acompañamiento.',
      conditions: 'El alcance definitivo se acuerda por escrito antes del inicio.',
    };

    const created = await request(app.getHttpServer())
      .post('/propuestas')
      .send(proposal)
      .expect(201);

    expect(created.body).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        code: 'ER-PROP-0001',
      }),
    );

    const pdf = await request(app.getHttpServer())
      .get(`/propuestas/${created.body.id as string}/pdf`)
      .expect(200)
      .expect('Content-Type', /application\/pdf/);

    expect(pdf.headers['content-disposition']).toContain('attachment;');
    expect(Number(pdf.headers['content-length'])).toBeGreaterThan(100_000);
  }, 20_000);

  afterAll(async () => {
    await app.close();
  });
});
