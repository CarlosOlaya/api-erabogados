export const ER_AREAS = [
  {
    id: 'civil',
    number: '01',
    title: 'Derecho Civil',
    description:
      'Procesos declarativos y de tenencia de la tierra, sucesiones, liquidaciones patrimoniales, cobro de obligaciones, incumplimiento contractual, estudios de títulos y debida diligencia inmobiliaria.',
  },
  {
    id: 'responsabilidad-civil',
    number: '02',
    title: 'Responsabilidad Civil',
    description:
      'Reclamación y defensa frente a daños contractuales y extracontractuales, así como la valoración integral de perjuicios.',
  },
  {
    id: 'seguros',
    number: '03',
    title: 'Seguros y Reaseguros',
    description:
      'Análisis de pólizas y coberturas, reclamaciones, objeciones y controversias derivadas de siniestros.',
  },
  {
    id: 'contractual',
    number: '04',
    title: 'Derecho Contractual',
    description:
      'Elaboración, revisión y negociación de contratos, prevención de contingencias, cumplimiento y terminación.',
  },
  {
    id: 'responsabilidad-estado',
    number: '05',
    title: 'Responsabilidad del Estado / Contencioso Administrativo',
    description:
      'Reparación directa, nulidad y restablecimiento del derecho, acciones populares y controversias con entidades públicas.',
  },
  {
    id: 'responsabilidad-fiscal',
    number: '06',
    title: 'Responsabilidad Fiscal',
    description:
      'Defensa ante la Contraloría en procesos por presunto detrimento del patrimonio público.',
  },
  {
    id: 'tributario',
    number: '07',
    title: 'Derecho Tributario',
    description:
      'Fiscalización, devoluciones y discusión de actos administrativos ante la DIAN y entes territoriales.',
  },
  {
    id: 'inmobiliario',
    number: '08',
    title: 'Derecho Inmobiliario y Urbanístico',
    description:
      'Saneamiento de títulos, licencias, propiedad horizontal, ordenamiento territorial y conflictos de tenencia.',
  },
  {
    id: 'laboral',
    number: '09',
    title: 'Derecho Laboral y Seguridad Social',
    description:
      'Contratación, terminaciones, procesos disciplinarios, litigios laborales y controversias de seguridad social.',
  },
  {
    id: 'corporativo',
    number: '10',
    title: 'Derecho Corporativo y Societario',
    description:
      'Constitución de sociedades, gobierno corporativo, reformas, actas, libros y contratación mercantil.',
  },
] as const;

export type AreaId = (typeof ER_AREAS)[number]['id'];
export type AreaSelection = Record<AreaId, boolean>;

export interface ProposalSnapshot {
  id: string;
  code: string;
  version: number;
  status: 'borrador' | 'lista' | 'publicada';
  client: {
    company: string;
    recipient: string;
    email: string;
  };
  context: string;
  narrative: {
    headline: string;
    valueStatement: string;
    decision: string;
  };
  areas: AreaSelection;
  scope: string;
  strategy: string;
  responsible: string;
  includeInvestment: boolean;
  investment: string;
  includeAdditionalValue: boolean;
  additionalValueLabel: string;
  additionalValue: string;
  conditions: string;
}

export interface StoredProposal {
  id: string;
  code: string;
  proposal: ProposalSnapshot;
  createdAt: string;
  updatedAt: string;
  publication?: ProposalPublication;
  publishedSnapshot?: PublicProposalSnapshot;
}

export interface ProposalPublication {
  token: string;
  slug?: string;
  version: number;
  status: 'published' | 'revoked';
  publishedAt: string;
  updatedAt: string;
  viewCount: number;
  lastViewedAt?: string;
  revokedAt?: string;
}

export type PublicProposalSnapshot = Omit<ProposalSnapshot, 'id' | 'client'> & {
  client: {
    company: string;
    recipient: string;
  };
};

export interface PublicationResult {
  proposalId: string;
  token: string;
  slug: string;
  path: string;
  version: number;
  status: 'published';
  publishedAt: string;
}

export interface DeletionResult {
  proposalId: string;
  status: 'deleted';
}

export interface RevocationResult {
  proposalId: string;
  token: string;
  status: 'revoked';
  revokedAt: string;
}

export interface PublicProposalResult {
  code: string;
  version: number;
  publishedAt: string;
  proposal: PublicProposalSnapshot;
}
