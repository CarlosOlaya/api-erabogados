import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProposalPublicationSlug1786600000000 implements MigrationInterface {
  name = 'AddProposalPublicationSlug1786600000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "proposals" ADD COLUMN "publication_slug" varchar(96)',
    );
    await queryRunner.query(
      'ALTER TABLE "proposals" ADD CONSTRAINT "UQ_proposals_publication_slug" UNIQUE ("publication_slug")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_proposals_publication_slug_lookup" ON "proposals" ("publication_slug", "publication_status")',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX "IDX_proposals_publication_slug_lookup"',
    );
    await queryRunner.query(
      'ALTER TABLE "proposals" DROP CONSTRAINT "UQ_proposals_publication_slug"',
    );
    await queryRunner.query(
      'ALTER TABLE "proposals" DROP COLUMN "publication_slug"',
    );
  }
}
