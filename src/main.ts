import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Railway termina TLS en su proxy: sin esto, `x-forwarded-for` se ignora y
  // el limitador de tasa vería una sola IP para todo el tráfico.
  app.set('trust proxy', 1);
  const localOrigins = ['http://localhost:4200', 'http://127.0.0.1:4200'];
  const configuredOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);
  const allowedOrigins = new Set([...localOrigins, ...configuredOrigins]);

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin || allowedOrigins.has(origin.replace(/\/+$/, ''))) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origen no autorizado por CORS: ${origin}`), false);
    },
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  });
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
void bootstrap();
