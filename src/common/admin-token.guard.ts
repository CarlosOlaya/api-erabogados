import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';

/**
 * Comparación en tiempo constante: evita que el tiempo de respuesta revele
 * cuántos caracteres del token acertó quien lo está probando.
 */
export const secureMatch = (left: string, right: string): boolean => {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
};

/**
 * Protege las rutas del estudio: listar, crear, editar, publicar y eliminar
 * propuestas. El portal del cliente no pasa por aquí — vive en
 * `propuestas/publicas` y `propuestas/portales`, que siguen siendo públicos.
 *
 * Falla cerrado a propósito: si `ER_ADMIN_TOKEN` no está configurada, se
 * rechaza todo. Un despliegue sin la variable deja el estudio inaccesible,
 * nunca abierto.
 */
@Injectable()
export class AdminTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const expected = process.env.ER_ADMIN_TOKEN?.trim();

    if (!expected) {
      throw new HttpException(
        'El servicio no tiene configurado el acceso administrativo.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const header = request.header('authorization') ?? '';
    const token = header.replace(/^Bearer\s+/i, '').trim();

    if (!token || !secureMatch(expected, token)) {
      throw new HttpException(
        'Se requiere autenticación para operar las propuestas.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return true;
  }
}
