import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  Unique,
} from 'typeorm';
import type { PublicProposalSnapshot } from './propuesta.types';

@Entity({ name: 'proposal_versions' })
@Unique('UQ_proposal_versions_proposal_version', ['proposalId', 'version'])
@Index('IDX_proposal_versions_proposal', ['proposalId', 'version'])
export class ProposalVersionEntity {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;

  @Column({ type: 'uuid', name: 'proposal_id' })
  proposalId!: string;

  @Column({ type: 'integer' })
  version!: number;

  @Column({ type: 'jsonb' })
  snapshot!: PublicProposalSnapshot;

  @Column({ type: 'timestamptz', name: 'published_at' })
  publishedAt!: Date;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}
