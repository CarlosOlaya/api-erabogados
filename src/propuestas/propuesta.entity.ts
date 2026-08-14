import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  Index,
  PrimaryColumn,
} from 'typeorm';
import type {
  ProposalSnapshot,
  PublicProposalSnapshot,
} from './propuesta.types';

@Entity({ name: 'proposals' })
@Check(
  'CHK_proposals_publication_status',
  `"publication_status" IS NULL OR "publication_status" IN ('published', 'revoked')`,
)
@Index('IDX_proposals_updated_at', ['updatedAt'])
@Index('IDX_proposals_publication_lookup', [
  'publicationToken',
  'publicationStatus',
])
@Index('IDX_proposals_publication_slug_lookup', [
  'publicationSlug',
  'publicationStatus',
])
export class ProposalEntity {
  @Column({ type: 'bigint', name: 'sequence_id', unique: true })
  @Generated('increment')
  sequenceId!: string;

  @PrimaryColumn({ type: 'uuid' })
  id!: string;

  @Column({ type: 'varchar', length: 32, unique: true, nullable: true })
  code!: string | null;

  @Column({ type: 'jsonb' })
  proposal!: ProposalSnapshot;

  @Column({ type: 'jsonb', name: 'published_snapshot', nullable: true })
  publishedSnapshot!: PublicProposalSnapshot | null;

  @Column({
    type: 'varchar',
    length: 64,
    name: 'publication_token',
    unique: true,
    nullable: true,
  })
  publicationToken!: string | null;

  @Column({
    type: 'varchar',
    length: 96,
    name: 'publication_slug',
    unique: true,
    nullable: true,
  })
  publicationSlug!: string | null;

  @Column({
    type: 'varchar',
    length: 16,
    name: 'publication_status',
    nullable: true,
  })
  publicationStatus!: 'published' | 'revoked' | null;

  @Column({ type: 'integer', name: 'publication_version', nullable: true })
  publicationVersion!: number | null;

  @Column({ type: 'timestamptz', name: 'published_at', nullable: true })
  publishedAt!: Date | null;

  @Column({
    type: 'timestamptz',
    name: 'publication_updated_at',
    nullable: true,
  })
  publicationUpdatedAt!: Date | null;

  @Column({ type: 'integer', name: 'view_count', default: 0 })
  viewCount!: number;

  @Column({ type: 'timestamptz', name: 'last_viewed_at', nullable: true })
  lastViewedAt!: Date | null;

  @Column({ type: 'timestamptz', name: 'revoked_at', nullable: true })
  revokedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @Column({ type: 'timestamptz', name: 'updated_at', default: () => 'now()' })
  updatedAt!: Date;
}
