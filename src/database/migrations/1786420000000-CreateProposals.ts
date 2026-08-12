import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProposals1786420000000 implements MigrationInterface {
  name = 'CreateProposals1786420000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "proposals" (
        "sequence_id" BIGSERIAL NOT NULL,
        "id" uuid NOT NULL,
        "code" character varying(32),
        "proposal" jsonb NOT NULL,
        "published_snapshot" jsonb,
        "publication_token" character varying(64),
        "publication_status" character varying(16),
        "publication_version" integer,
        "published_at" TIMESTAMP WITH TIME ZONE,
        "publication_updated_at" TIMESTAMP WITH TIME ZONE,
        "view_count" integer NOT NULL DEFAULT 0,
        "last_viewed_at" TIMESTAMP WITH TIME ZONE,
        "revoked_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_proposals_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_proposals_sequence" UNIQUE ("sequence_id"),
        CONSTRAINT "UQ_proposals_code" UNIQUE ("code"),
        CONSTRAINT "UQ_proposals_publication_token" UNIQUE ("publication_token"),
        CONSTRAINT "CHK_proposals_publication_status"
          CHECK ("publication_status" IS NULL OR "publication_status" IN ('published', 'revoked'))
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "IDX_proposals_updated_at" ON "proposals" ("updated_at" DESC)',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_proposals_publication_lookup" ON "proposals" ("publication_token", "publication_status")',
    );
    await queryRunner.query(`
      CREATE TABLE "proposal_versions" (
        "id" uuid NOT NULL,
        "proposal_id" uuid NOT NULL,
        "version" integer NOT NULL,
        "snapshot" jsonb NOT NULL,
        "published_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_proposal_versions_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_proposal_versions_proposal_version" UNIQUE ("proposal_id", "version"),
        CONSTRAINT "FK_proposal_versions_proposal"
          FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "IDX_proposal_versions_proposal" ON "proposal_versions" ("proposal_id", "version")',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "proposal_versions"');
    await queryRunner.query('DROP TABLE "proposals"');
  }
}
