import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import type { FirmProfileInput } from './firma.types';

@Entity({ name: 'firm_profiles' })
export class FirmProfileEntity {
  @PrimaryColumn({ type: 'varchar', length: 32 })
  id!: string;

  @Column({ type: 'integer' })
  version!: number;

  @Column({ type: 'jsonb' })
  profile!: FirmProfileInput;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
