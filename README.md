# API ER Abogados

API independiente en Nest para las soluciones de `app-erabogados`. Su primer módulo persiste borradores en PostgreSQL, publica snapshots versionados mediante un enlace estable y conserva el PDF como resumen ejecutivo secundario.

## Publicación de propuestas

1. Angular guarda el borrador interno.
2. Nest valida el contenido y congela la versión que se va a compartir.
3. La primera publicación crea un token de seguridad y un identificador legible por empresa; las siguientes conservan el mismo enlace.
4. Editar el borrador no modifica la experiencia pública hasta que se publique otra vez.
5. El payload público excluye el correo del cliente y el identificador interno.

El PDF generado con `pdfmake` 0.2.18 sigue disponible como resumen para archivo o comité, pero la experiencia web publicada es la versión principal.

## Endpoints

Las rutas del estudio exigen `Authorization: Bearer <ER_ADMIN_TOKEN>`:

```text
POST   /propuestas
PATCH  /propuestas/:id
GET    /propuestas
GET    /propuestas/:id
GET    /propuestas/:id/pdf
POST   /propuestas/:id/publicar
DELETE /propuestas/:id/publicacion
DELETE /propuestas/:id
PUT    /firma/perfil
```

Las del portal del cliente son públicas y están limitadas a 30 peticiones por minuto y por IP,
para que nadie pueda recorrer slugs en masa buscando a qué empresas se les está presentando:

```text
GET    /propuestas/portales/:slug          · ?interno=1 no cuenta la visita
GET    /propuestas/portales/:slug/pdf
GET    /propuestas/publicas/:token
GET    /propuestas/publicas/:token/pdf
GET    /firma/perfil
GET    /health
```

Las rutas públicas envían `Cache-Control: no-store` y `X-Robots-Tag: noindex, nofollow, noarchive`.

Si `ER_ADMIN_TOKEN` no está configurada, la API responde `503` a las rutas del estudio: falla
cerrado, nunca las deja abiertas.

## Enlaces del portal

El slug conserva el nombre normalizado de la empresa (`sodexo-colombia`) para que el enlace sea
legible al compartirlo. Si ya existe otro portal con ese nombre, se añade únicamente un ordinal
(`sodexo-colombia-2`). Los enlaces históricos que ya tenían un sufijo no se modifican de forma
automática.

## Aviso de apertura

Con `PORTAL_NOTIFY_WEBHOOK` configurada, la API envía un JSON cuando un cliente abre su portal
—primera apertura, o reapertura tras seis horas de silencio—. Sirve cualquier webhook que reciba
JSON: Slack, Make, n8n. Sin la variable, no se envía nada.

## Registro maestro de la firma

El perfil corporativo —contacto, áreas de práctica, integrantes, testimonios y métricas— vive en PostgreSQL y se expone de forma pública, sin datos de propuestas, en `GET /firma/perfil`.

La actualización requiere `PUT /firma/perfil` con `Authorization: Bearer <ER_ADMIN_TOKEN>`. Al guardar, la versión aumenta y la API puede solicitar las reconstrucciones de Vercel mediante estas variables de Railway:

```text
ER_ADMIN_TOKEN=<token-largo-y-privado>
LANDING_DEPLOY_HOOK=<deploy-hook-del-proyecto-landing>
PORTAL_DEPLOY_HOOK=<deploy-hook-del-proyecto-app>
```

Los porcentajes, cifras de éxito y tiempos no se publican hasta que el registro los marque como `publicable`, con evidencia y fecha de validación.

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
ER_ADMIN_TOKEN=<token-largo-y-privado>
LANDING_DEPLOY_HOOK=<deploy-hook-de-la-landing>
PORTAL_DEPLOY_HOOK=<deploy-hook-del-portal>
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
