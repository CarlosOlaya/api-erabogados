export interface FirmAddress {
  street: string;
  building: string;
  office: string;
  neighborhood: string;
  city: string;
  department: string;
  country: string;
}

export interface FirmPracticeArea {
  id: string;
  number: string;
  label: string;
  title: string;
  description: string;
  portal: {
    businessRisk: string;
    intervention: string;
    decisionValue: string;
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
  practiceAreas: FirmPracticeArea[];
  team: FirmTeamMember[];
  metrics: FirmMetric[];
  testimonials: FirmTestimonial[];
}

export interface PublicFirmProfile extends FirmProfileInput {
  version: number;
  updatedAt: string;
}
