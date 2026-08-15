import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Los slugs creados antes de esta migración eran el nombre normalizado de la
 * empresa, así que cualquiera podía reconstruir la URL de una propuesta
 * confidencial partiendo del nombre del cliente.
 *
 * Aquí se les añade un sufijo aleatorio. Esto INVALIDA los enlaces ya enviados:
 * hay que volver a compartir el portal con los clientes afectados. Se hace a
 * propósito — un enlace que sigue siendo adivinable no se arregla solo.
 */
export class RandomizePublicationSlug1786700000000 implements MigrationInterface {
  name = 'RandomizePublicationSlug1786700000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // `substr`, `md5` y `random` son nativas: sin extensión pgcrypto y sin
    // funciones que el Postgres en memoria de las pruebas no implemente.
    await queryRunner.query(`
      UPDATE "proposals"
      SET "publication_slug" =
        substr("publication_slug", 1, 80) || '-' ||
        substr(md5(random()::text || "id"::text), 1, 8)
      WHERE "publication_slug" IS NOT NULL
    `);
  }

  /**
   * Irreversible por diseño: el nombre original se puede reconstruir desde la
   * empresa, pero volver a un slug adivinable sería reintroducir el problema.
   */
  async down(): Promise<void> {
    // Sin reversa.
  }
}
