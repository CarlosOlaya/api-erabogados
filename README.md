# API ER Abogados

API independiente en Nest para las soluciones de `app-erabogados`. Su primer módulo guarda borradores, publica snapshots versionados mediante un enlace estable y conserva el PDF como resumen ejecutivo secundario.

## Publicación de propuestas

1. Angular guarda el borrador interno.
2. Nest valida el contenido y congela la versión que se va a compartir.
3. La primera publicación crea un token aleatorio y las siguientes conservan el mismo enlace.
4. Editar el borrador no modifica la experiencia pública hasta que se publique otra vez.
5. El payload público excluye el correo del cliente y el identificador interno.

El PDF generado con `pdfmake` 0.2.18 sigue disponible como resumen para archivo o comité, pero la experiencia web publicada es la versión principal.

## Endpoints

```text
POST   /propuestas
PATCH  /propuestas/:id
GET    /propuestas
GET    /propuestas/:id
GET    /propuestas/:id/pdf
POST   /propuestas/:id/publicar
DELETE /propuestas/:id/publicacion

GET    /propuestas/publicas/:token
GET    /propuestas/publicas/:token/pdf
```

Las rutas públicas envían `Cache-Control: no-store` y `X-Robots-Tag: noindex, nofollow, noarchive`. Las rutas internas todavía requieren autenticación antes de un despliegue productivo.

## Desarrollo local

```bash
npm ci
npm run start:dev
```

La API escucha en `http://localhost:3000` y permite solicitudes desde la app local en el puerto `4200`.

## Verificación

```bash
npm run build
npm run test:e2e
```

## Alcance de esta primera versión

Los borradores, publicaciones y métricas de acceso se conservan en memoria para validar el flujo. Se reinician al reiniciar el proceso; por lo tanto, los enlaces actuales son únicamente de demostración. Antes de producción se debe incorporar autenticación, roles, persistencia en base de datos, configuración de orígenes por ambiente y almacenamiento durable de versiones aprobadas.
