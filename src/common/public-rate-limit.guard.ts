import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;
/** Tope de IPs en memoria. Evita que el propio limitador sea el vector. */
const MAX_TRACKED = 5_000;

interface Window {
  count: number;
  resetAt: number;
}

/**
 * Limita los accesos anónimos al portal. El objetivo no es el cliente legítimo
 * —que abre su enlace unas pocas veces— sino quien recorre slugs en masa para
 * descubrir a qué empresas les estamos presentando.
 *
 * Ventana fija en memoria: la API corre en una sola instancia, así que no hace
 * falta almacenamiento compartido. Si algún día se escala horizontalmente, esto
 * debe pasar a Redis.
 */
@Injectable()
export class PublicRateLimitGuard implements CanActivate {
  private readonly windows = new Map<string, Window>();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const now = Date.now();
    const key = this.clientKey(request);

    this.prune(now);

    const current = this.windows.get(key);
    if (!current || current.resetAt <= now) {
      this.windows.set(key, { count: 1, resetAt: now + WINDOW_MS });
      return true;
    }

    current.count += 1;
    if (current.count > MAX_REQUESTS) {
      throw new HttpException(
        'Demasiadas consultas. Intente de nuevo en un minuto.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  private clientKey(request: Request): string {
    const forwarded = request.header('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0].trim();
    return request.ip ?? 'desconocido';
  }

  private prune(now: number): void {
    if (this.windows.size < MAX_TRACKED) {
      for (const [key, window] of this.windows) {
        if (window.resetAt <= now) this.windows.delete(key);
      }
      return;
    }

    this.windows.clear();
  }
}
