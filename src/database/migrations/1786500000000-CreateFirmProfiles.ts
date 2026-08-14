import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFirmProfiles1786500000000 implements MigrationInterface {
  name = 'CreateFirmProfiles1786500000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "firm_profiles" (
        "id" character varying(32) NOT NULL,
        "version" integer NOT NULL,
        "profile" jsonb NOT NULL,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_firm_profiles" PRIMARY KEY ("id")
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "firm_profiles"');
  }
}
