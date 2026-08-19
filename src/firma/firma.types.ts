export interface FirmAddress {
  street: string;
  building: string;
  office: string;
  neighborhood: string;
  city: string;
  department: string;
  country: string;
}

/**
 * Identificador del frente integrado al que pertenece un área.
 *
 * Los frentes no reemplazan a las áreas: son la perspectiva desde la que se
 * mira una misma decisión empresarial. Una operación rara vez es «un asunto
 * contractual» a secas; es un acuerdo que además tiene un órgano que lo
 * aprueba, una autoridad que lo revisa y un patrimonio que lo respalda.
 *
 * El litigio no está en esta lista a propósito: no es un frente más, sino la
 * cara defensiva que todo frente tiene. Por eso cada área declara qué previene
 * y cómo se defiende, en lugar de existir un frente «litigioso» separado del
 * trabajo preventivo.
 */
export type FirmFrontId = 'contractual' | 'corporativo' | 'regulatorio' | 'patrimonial';

export interface FirmFront {
  id: FirmFrontId;
  number: string;
  /** Nombre corto, el que se usa como rótulo. */
  label: string;
  /** Qué mira este frente, en una línea. */
  title: string;
  /** Cuándo se activa: «cuando lo que está en juego es…». */
  atStake: string;
  /** Qué hace la firma desde este frente. */
  description: string;
  /**
   * Las dos caras del frente. Viven aquí, y no solo en cada materia, porque
   * prevenir/defender es la tesis de la firma —no un atributo de una
   * especialidad—: el mismo frente responde antes y después del conflicto.
   */
  prevention: string;
  defense: string;
  /** La disciplina que encabeza el frente, para nombrarlo en términos jurídicos. */
  primaryDiscipline: string;
}

export interface FirmPracticeArea {
  id: string;
  number: string;
  label: string;
  title: string;
  description: string;
  /** Frente integrado desde el que se aborda esta materia. */
  front: FirmFrontId;
  portal: {
    businessRisk: string;
    intervention: string;
    decisionValue: string;
    /** Qué se hace antes de que el conflicto exista. */
    prevention: string;
    /** Cómo se sostiene la posición si termina discutida. */
    defense: string;
  };
}

export interface FirmTeamMember {
  id: string;
  name: string;
  role: string;
  level: string;
  areas: string[];
  summary: string;
  imageKey: string;
  linkedin?: string;
  aliases?: string[];
}

export interface FirmMetric {
  id: string;
  label: string;
  value: string | null;
  evidence: string | null;
  validatedAt: string | null;
  publicable: boolean;
}

export interface FirmTestimonial {
  id: string;
  quote: string;
  author: string;
  reference: string;
  monogram: string;
}

export interface FirmProfileInput {
  schemaVersion: number;
  identity: {
    name: string;
    legalName: string;
    description: string;
    language: string;
    website: string;
    instagram: string;
  };
  contact: {
    phone: string;
    phoneE164: string;
    email: string;
    address: FirmAddress;
    correspondence: Array<{
      city: string;
      department: string;
      lines: string[];
    }>;
  };
  fronts: FirmFront[];
  practiceAreas: FirmPracticeArea[];
  team: FirmTeamMember[];
  metrics: FirmMetric[];
  testimonials: FirmTestimonial[];
}

export interface PublicFirmProfile extends FirmProfileInput {
  version: number;
  updatedAt: string;
}
