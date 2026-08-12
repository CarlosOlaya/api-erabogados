# API ER Abogados

API independiente en Nest para las soluciones de `app-erabogados`. Su primer módulo persiste borradores en PostgreSQL, publica snapshots versionados mediante un enlace estable y conserva el PDF como resumen ejecutivo secundario.

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
GET    /health
```

Las rutas públicas envían `Cache-Control: no-store` y `X-Robots-Tag: noindex, nofollow, noarchive`. Las rutas internas todavía requieren autenticación antes de un despliegue productivo.

## Desarrollo local

La API necesita PostgreSQL. Copie `.env.example` a `.env`, ajuste `DATABASE_URL` y ejecute la migración inicial:

```bash
npm ci
npm run build
npm run migration:run
npm run start:dev
```

La API escucha en `http://localhost:3000` y permite solicitudes desde la app local en el puerto `4200`.

## Despliegue en Railway

1. Agregue un servicio PostgreSQL al mismo proyecto y ambiente de Railway.
2. En el servicio de la API cree una variable de referencia `DATABASE_URL` que apunte a `Postgres.DATABASE_URL`. Esta conexión usa la red privada de Railway.
3. Configure los orígenes permitidos:

```text
CORS_ORIGINS=https://su-app.vercel.app,https://su-dominio.com
DB_SSL=false
DB_POOL_MAX=5
```

`railway.json` compila la aplicación, ejecuta las migraciones como paso previo al despliegue, inicia Nest y comprueba `/health`. El control de salud solo responde correctamente cuando PostgreSQL también está disponible. Railway proporciona `PORT` automáticamente.

No use `DATABASE_PUBLIC_URL` entre la API y PostgreSQL: la URL privada evita exposición innecesaria y tráfico saliente. Para una conexión externa de administración use una URL pública únicamente durante esa operación.

## Verificación

```bash
npm run build
npm run test:e2e
```

## Alcance de esta primera versión

PostgreSQL conserva borradores, datos del cliente, el snapshot activo, el historial inmutable de cada versión publicada, tokens, revocaciones y métricas de acceso después de reinicios y nuevos despliegues. Los PDF se generan bajo demanda desde el payload persistido y no se almacenan como archivos binarios.

La autenticación y los roles siguen siendo obligatorios antes de exponer el estudio interno como producto final. También se deben activar copias de seguridad periódicas en Railway antes de operar información real de clientes.
