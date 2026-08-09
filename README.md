# API ER Abogados

API independiente en Nest para las soluciones de `app-erabogados`. Su primer módulo guarda snapshots de propuestas y genera el PDF oficial en el servidor.

## Motor de PDF

La implementación replica el patrón productivo de Foodly:

1. Angular envía la propuesta a la API.
2. Nest conserva un snapshot con código y versión.
3. `pdfmake` 0.2.18 compone el documento y devuelve un `Buffer`.
4. Angular recibe el archivo como `Blob` y activa la descarga.

El navegador no captura HTML para crear el PDF; el documento es reproducible y se genera de forma centralizada.

## Endpoints actuales

```text
POST   /propuestas
PATCH  /propuestas/:id
GET    /propuestas
GET    /propuestas/:id
GET    /propuestas/:id/pdf
```

## Desarrollo local

```bash
npm install
npm run start:dev
```

La API escucha en `http://localhost:3000` y permite solicitudes desde la app local en el puerto `4200`.

## Verificación

```bash
npm run build
npm run test:e2e
```

## Alcance de esta primera versión

Los snapshots se conservan en memoria para validar el flujo, la experiencia y el documento. Se reinician al reiniciar el proceso. Antes de producción, el siguiente paso es incorporar autenticación, roles, persistencia en base de datos, catálogo editable de plantillas y almacenamiento de versiones aprobadas.
# api-erabogados
