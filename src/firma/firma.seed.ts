import type { FirmProfileInput } from './firma.types';

/**
 * Carga inicial del registro corporativo. Después de la primera migración, la
 * base de datos es la autoridad; este archivo solo permite inicializar entornos
 * nuevos de forma reproducible.
 */
export const INITIAL_FIRM_PROFILE = {
  schemaVersion: 1,
  identity: {
    name: 'ER Abogados',
    legalName: 'ER Firma de Abogados y Asociados S.A.S.',
    description:
      'Firma especializada e interdisciplinaria, con rigor técnico, método y estrategia.',
    language: 'es-CO',
    website: 'https://erabogados.co',
    instagram: 'https://www.instagram.com/er.firmadeabogados/',
  },
  contact: {
    phone: '+57 324 275 7680',
    phoneE164: '573242757680',
    email: 'info@erabogados.co',
    address: {
      street: 'Carrera 19A #13A–46',
      building: 'Edificio Branjy',
      office: 'Oficina 101',
      neighborhood: 'Barrio La Ford',
      city: 'Sincelejo',
      department: 'Sucre',
      country: 'CO',
    },
    correspondence: [
      {
        city: 'Medellín',
        department: 'Antioquia',
        lines: ['Cra. 45 #53-104', 'Entre Caracas y Maracaibo'],
      },
      {
        city: 'Barranquilla',
        department: 'Atlántico',
        lines: [
          'Calle 97 #42F-43',
          'Edificio Mirador del Mar 2, Torre 5, Apto. 417',
          'Miramar',
        ],
      },
    ],
  },
  /*
    Los frentes, con la redacción que entregó el cliente.

    El orden es el suyo —contractual, corporativo, patrimonial— y el
    regulatorio cierra la serie. `prevention`/`defense` viven aquí y no solo
    en cada materia porque prevenir→defender es la tesis de la firma, no un
    atributo de una especialidad.
  */
  fronts: [
    {
      id: 'contractual', number: '01', label: 'Arquitectura contractual',
      title: 'Los compromisos que sostienen una decisión empresarial.',
      atStake: 'Cuando lo que está en juego es un acuerdo: qué se prometió, en qué condiciones y qué ocurre si no se cumple.',
      description: 'Estructuramos acuerdos que distribuyen riesgos, asignan responsabilidades y anticipan escenarios de conflicto para dar solidez a cada decisión.',
      prevention: 'Construimos decisiones respaldadas por reglas claras, una adecuada distribución de riesgos y mecanismos que anticipan escenarios de tensión.',
      defense: 'Cuando una decisión es cuestionada, cuenta desde su origen con la estructura y el respaldo necesarios para sostenerse.',
      primaryDiscipline: 'Derecho Contractual',
    },
    {
      id: 'corporativo', number: '02', label: 'Gobierno corporativo',
      title: 'Quién decide, con qué autoridad y con qué respaldo.',
      atStake: 'Cuando lo que está en juego es la decisión societaria: quién tenía la facultad, por qué órgano y con qué trazabilidad.',
      description: 'Fortalecemos la legitimidad de las decisiones societarias mediante estructuras de gobierno, reglas de funcionamiento y trazabilidad.',
      prevention: 'Definimos competencias, procedimientos y soportes que reducen contingencias y fortalecen la toma de decisiones.',
      defense: 'Respaldamos la validez de las decisiones cuando son cuestionadas por socios, administradores, autoridades o terceros.',
      primaryDiscipline: 'Corporativo y Societario',
    },
    {
      id: 'patrimonial', number: '03', label: 'Protección patrimonial',
      title: 'Proteger el patrimonio antes de tener que recuperarlo.',
      atStake: 'Cuando lo que está en juego es el patrimonio: el activo, el daño, la cobertura y la recuperación.',
      description: 'Diseñamos estrategias para preservar activos, gestionar contingencias y fortalecer la capacidad de respuesta frente a reclamaciones.',
      prevention: 'Identificamos riesgos y estructuramos mecanismos de protección que reducen la exposición jurídica y económica.',
      defense: 'Cuando el patrimonio entra en discusión, construimos una defensa sólida sustentada en responsabilidad, evidencia y valoración del daño.',
      primaryDiscipline: 'Responsabilidad Civil, Seguros y Reaseguros',
    },
    /*
      Este frente no venía en la entrega del cliente —su documento cubría los
      tres anteriores— y está redactado aquí siguiendo esa misma estructura.
      Pendiente de su visto bueno.
    */
    {
      id: 'regulatorio', number: '04', label: 'Cumplimiento regulatorio',
      title: 'Lo que una autoridad puede exigir, revisar o sancionar.',
      atStake: 'Cuando lo que está en juego es la relación con una autoridad: términos, competencia y carga de la prueba.',
      description: 'Ordenamos la relación con autoridades administrativas, tributarias, fiscales y laborales para que una actuación no comprometa la continuidad de la operación.',
      prevention: 'Anticipamos términos, competencias y soportes probatorios para que una revisión encuentre la decisión ya documentada.',
      defense: 'Cuando la actuación ya está abierta, sostenemos la posición de la empresa con la trazabilidad construida desde el origen.',
      primaryDiscipline: 'Administrativo, Tributario, Fiscal y Laboral',
    },
  ],
  practiceAreas: [
    {
      id: 'civil', number: '01', label: 'Civil', title: 'Derecho Civil',
      description: 'Procesos declarativos y de tenencia de la tierra, sucesiones, liquidaciones patrimoniales, cobro de obligaciones, incumplimiento contractual, estudios de títulos y debida diligencia inmobiliaria.',
      front: 'patrimonial',
      portal: {
        businessRisk: 'Obligaciones, activos o cartera sin una ruta probatoria y de recuperación clara.',
        intervention: 'Ordenamos hechos, títulos, obligaciones, evidencia y rutas procesales o notariales antes de escalar el conflicto.',
        decisionValue: 'Protección patrimonial y decisiones sustentadas en escenarios reales de recuperación.',
        prevention: 'Estudio de títulos y depuración de obligaciones antes de comprometer el activo o la cartera.',
        defense: 'Ruta procesal y prueba documental listas cuando la recuperación pasa a estrados.',
      },
    },
    {
      id: 'responsabilidad-civil', number: '02', label: 'Responsabilidad civil', title: 'Responsabilidad Civil',
      description: 'Reclamación y defensa frente a daños contractuales y extracontractuales, así como la valoración integral de perjuicios.',
      front: 'patrimonial',
      portal: {
        businessRisk: 'Daños, reclamaciones o exposiciones económicas cuyo impacto todavía no está delimitado.',
        intervention: 'Determinamos responsabilidad, causalidad, evidencia y valoración de perjuicios.',
        decisionValue: 'Una posición de negociación o defensa construida sobre el impacto económico verificable.',
        prevention: 'Matriz de exposición por daño y aseguramiento de la evidencia desde el primer reporte.',
        defense: 'Causalidad, imputación y tasación de perjuicios sostenidas ante juez o tribunal.',
      },
    },
    {
      id: 'seguros', number: '03', label: 'Seguros', title: 'Seguros y Reaseguros',
      description: 'Análisis de pólizas y coberturas, reclamaciones, objeciones y controversias derivadas de siniestros.',
      front: 'patrimonial',
      portal: {
        businessRisk: 'Coberturas inciertas, objeciones o reclamaciones que pueden trasladar el costo a la empresa.',
        intervention: 'Leemos el programa de seguros, contrastamos el siniestro y estructuramos la reclamación o defensa.',
        decisionValue: 'Claridad sobre cobertura, oportunidad de respuesta y exposición financiera.',
        prevention: 'Lectura del programa de seguros y de sus exclusiones antes de que ocurra el siniestro.',
        defense: 'Reclamación y controversia sostenidas frente a la aseguradora cuando objeta la cobertura.',
      },
    },
    {
      id: 'contractual', number: '04', label: 'Contractual', title: 'Derecho Contractual',
      description: 'Elaboración, revisión y negociación de contratos, prevención de contingencias, cumplimiento y terminación.',
      front: 'contractual',
      portal: {
        businessRisk: 'Contratos que distribuyen mal los riesgos o frenan la operación cuando aparece una contingencia.',
        intervention: 'Traducimos la operación en obligaciones, hitos, controles y mecanismos de salida ejecutables.',
        decisionValue: 'Acuerdos que sostienen la operación y permiten actuar antes de que el conflicto crezca.',
        prevention: 'Asignación de riesgos, hitos y mecanismos de salida escritos en el propio contrato.',
        defense: 'Cláusulas y evidencia contractual construidas para sostener el incumplimiento que se discuta.',
      },
    },
    {
      id: 'responsabilidad-estado', number: '05', label: 'Administrativo', title: 'Responsabilidad del Estado / Contencioso Administrativo',
      description: 'Reparación directa, nulidad y restablecimiento del derecho, acciones populares y controversias con entidades públicas.',
      front: 'regulatorio',
      portal: {
        businessRisk: 'Decisiones públicas, actuaciones administrativas o daños estatales que afectan continuidad y patrimonio.',
        intervention: 'Controlamos términos, procedencia, evidencia y estrategia frente a la entidad o jurisdicción.',
        decisionValue: 'Una ruta procesal o preventiva con tiempos críticos y responsables definidos.',
        prevention: 'Control de términos, procedencia y actuación administrativa antes de que precluyan.',
        defense: 'Reparación directa o nulidad y restablecimiento, con la prueba armada desde el origen.',
      },
    },
    {
      id: 'responsabilidad-fiscal', number: '06', label: 'Fiscal', title: 'Responsabilidad Fiscal',
      description: 'Defensa ante la Contraloría en procesos por presunto detrimento del patrimonio público.',
      front: 'regulatorio',
      portal: {
        businessRisk: 'Hallazgos o actuaciones fiscales que comprometen recursos, administradores o contratistas.',
        intervention: 'Reconstruimos la gestión fiscal, el nexo causal y la evidencia técnica de la decisión.',
        decisionValue: 'Defensa coordinada con la realidad financiera, contractual y operativa del caso.',
        prevention: 'Trazabilidad de la gestión fiscal y del soporte técnico de cada decisión de gasto.',
        defense: 'Descargos y defensa ante la Contraloría con el nexo causal reconstruido.',
      },
    },
    {
      id: 'tributario', number: '07', label: 'Tributario', title: 'Derecho Tributario',
      description: 'Fiscalización, devoluciones y discusión de actos administrativos ante la DIAN y entes territoriales.',
      front: 'regulatorio',
      portal: {
        businessRisk: 'Contingencias fiscales que alteran caja, planeación y capacidad de inversión.',
        intervention: 'Revisamos hechos, soportes y procedimiento para definir corrección, discusión o defensa.',
        decisionValue: 'Visibilidad del impacto tributario y una posición sustentada frente a la administración.',
        prevention: 'Revisión de hechos y soportes para corregir antes de que la administración fiscalice.',
        defense: 'Discusión de actos y recursos ante la DIAN o el ente territorial.',
      },
    },
    {
      id: 'inmobiliario', number: '08', label: 'Inmobiliario', title: 'Derecho Inmobiliario y Urbanístico',
      description: 'Saneamiento de títulos, licencias, propiedad horizontal, ordenamiento territorial y conflictos de tenencia.',
      front: 'patrimonial',
      portal: {
        businessRisk: 'Activos, licencias o restricciones urbanísticas que pueden detener inversión y ejecución.',
        intervention: 'Conectamos títulos, usos, permisos y obligaciones para identificar condiciones de viabilidad.',
        decisionValue: 'Seguridad para adquirir, desarrollar, financiar o disponer del activo.',
        prevention: 'Verificación de títulos, usos, licencias y restricciones antes de invertir o desarrollar.',
        defense: 'Defensa de la licencia, la tenencia o el uso ante autoridad o tercero.',
      },
    },
    {
      id: 'laboral', number: '09', label: 'Laboral', title: 'Derecho Laboral y Seguridad Social',
      description: 'Contratación, terminaciones, procesos disciplinarios, litigios laborales y controversias de seguridad social.',
      front: 'regulatorio',
      portal: {
        businessRisk: 'Decisiones de talento humano que generan contingencias, litigios o pérdida de continuidad.',
        intervention: 'Alineamos contratación, disciplina, terminación y evidencia con la realidad de la operación.',
        decisionValue: 'Decisiones laborales consistentes, documentadas y ejecutables.',
        prevention: 'Contratación, disciplina y terminación documentadas para que resistan revisión.',
        defense: 'Defensa del despido, la desvinculación o la controversia de seguridad social.',
      },
    },
    {
      id: 'corporativo', number: '10', label: 'Corporativo', title: 'Derecho Corporativo y Societario',
      description: 'Constitución de sociedades, gobierno corporativo, reformas, actas, libros y contratación mercantil.',
      front: 'corporativo',
      portal: {
        businessRisk: 'Decisiones societarias sin gobierno, trazabilidad o responsabilidades suficientemente claras.',
        intervention: 'Diseñamos reglas, órganos, documentos y controles para ejecutar la decisión empresarial.',
        decisionValue: 'Gobierno corporativo que reduce fricción y permite crecer con orden.',
        prevention: 'Órganos, actas y reglas de decisión que dejan trazabilidad de quién decidió qué.',
        defense: 'Respaldo documental de la decisión societaria cuando un socio o un tercero la impugna.',
      },
    },
  ],
  team: [
    {
      id: 'eduardo-ramos-kleber', name: 'Eduardo Alonso Ramos Kléber', role: 'Socio fundador y representante legal', level: 'Gerencia operativa',
      areas: ['Regulatorio', 'Servicios Públicos', 'Inmobiliario', 'Urbanístico', 'Responsabilidad precontractual del Estado'],
      summary: 'Lidera la firma y estructura estrategias jurídicas en asuntos regulatorios, servicios públicos, derecho inmobiliario y urbanístico, y responsabilidad precontractual del Estado.',
      imageKey: 'eduardo-ramos-kleber', linkedin: 'https://www.linkedin.com/in/eduardo-a-ramos-kleber-1040b3126/',
    },
    {
      id: 'liceth-villalba-garcia', name: 'Liceth Carolina Villalba García', role: 'Socia', level: 'Gerencia operativa',
      areas: ['Litigios', 'Derecho Civil y Procesal Civil', 'Responsabilidad Civil', 'Seguros'],
      summary: 'Lidera el área de Litigios, con énfasis en asuntos civiles y de familia, procesos ejecutivos y cobro de obligaciones, sucesiones, divorcios y liquidaciones patrimoniales, responsabilidad civil contractual y extracontractual, y seguros.',
      imageKey: 'liceth-villalba-garcia', linkedin: 'https://www.linkedin.com/in/liceth-carolina-villalba-garcia-83103b426/',
    },
    {
      id: 'eloy-perez-paternina', name: 'Eloy Pérez Paternina', role: 'Socio', level: 'Gerencia operativa',
      areas: ['Derecho Laboral', 'Seguridad Social', 'Derecho Tributario', 'Compliance'],
      summary: 'Lidera las áreas de Derecho Laboral, Seguridad Social, Derecho Tributario y Compliance, con asesoría preventiva, gestión de contingencias y estrategias para organizaciones de los sectores público y privado.',
      imageKey: 'eloy-perez-paternina', aliases: ['Eloy Andrés Pérez Paternina'], linkedin: 'https://www.linkedin.com/in/eloy-perez-paternina-372b2b13b/',
    },
    {
      id: 'marisa-quintero-monterroza', name: 'Marisa Paulina Quintero Monterroza', role: 'Abogada Senior', level: 'Abogada Senior',
      areas: ['Derecho Laboral', 'Derecho Laboral Corporativo'],
      summary: 'Concentra su práctica en Derecho Laboral y Derecho Laboral Corporativo. Asesora la gestión de relaciones de trabajo y representa a los clientes en procesos judiciales, actuaciones administrativas, audiencias y diligencias de descargos.',
      imageKey: 'marisa-quintero-monterroza', linkedin: 'https://www.linkedin.com/in/marisa-paulina-quintero-monterroza-13518716b/',
    },
    {
      id: 'valentina-arrieta-martinez', name: 'Valentina Arrieta Martínez', role: 'Abogada Junior', level: 'Abogada Junior',
      areas: ['Derecho Corporativo y Empresarial'],
      summary: 'Acompaña asuntos corporativos y societarios, gobierno corporativo, contratación comercial, análisis regulatorio y elaboración de conceptos jurídicos.',
      imageKey: 'valentina-arrieta-martinez', linkedin: 'https://www.linkedin.com/in/valentina-arrieta-martinez-01a4772b1/',
    },
    {
      id: 'marcel-canchila-perez', name: 'Marcel Andrés Canchila Pérez', role: 'Asistente Jurídico', level: 'Apoyo jurídico',
      areas: ['Litigios Civiles', 'Contencioso Administrativo'],
      summary: 'Apoya la preparación de escritos, recursos y acciones constitucionales, el seguimiento procesal y la gestión de asuntos civiles y contencioso-administrativos.',
      imageKey: 'marcel-canchila-perez', linkedin: 'https://www.linkedin.com/in/marcel-andres-canchila-perez-72552136/',
    },
    {
      id: 'saraemy-samur-salas', name: 'Saraemy Samur Salas', role: 'Asistente Jurídica', level: 'Apoyo jurídico',
      areas: ['Derecho Laboral'],
      summary: 'Apoya la elaboración de demandas, respuestas, recursos y contratos laborales, así como la organización de expedientes y la construcción de estrategias de caso.',
      imageKey: 'saraemy-samur-salas', linkedin: 'https://www.linkedin.com/in/saraemy-samur-salas-a64959427/',
    },
    {
      id: 'fernando-pinzon', name: 'Fernando Pinzón', role: 'Abogado', level: 'Abogado',
      areas: ['Derecho Inmobiliario', 'Derecho Urbanístico', 'Derecho de Tierras', 'Asuntos Prediales y Titulación', 'Negocios Inmobiliarios', 'Escrituras Públicas'],
      summary: 'Su práctica comprende Derecho Inmobiliario, Urbanístico y de Tierras; asuntos prediales y titulación; estructuración y formalización de negocios inmobiliarios; y elaboración y revisión de escrituras públicas.',
      imageKey: 'fernando-pinzon-verbel', linkedin: 'https://www.linkedin.com/in/fernando-pinzon-345ba1427/',
    },
  ],
  metrics: [
    { id: 'consultas-atendidas', label: 'Consultas atendidas', value: null, evidence: null, validatedAt: null, publicable: false },
    { id: 'resultados-favorables', label: 'Resultados favorables', value: null, evidence: null, validatedAt: null, publicable: false },
    { id: 'trayectoria', label: 'Trayectoria de la firma', value: null, evidence: null, validatedAt: null, publicable: false },
  ],
  testimonials: [
    {
      id: 'pedro-ramos', author: 'Pedro Ramos', reference: 'Cliente empresarial', monogram: 'PR',
      quote: 'Para nuestra empresa, el acompañamiento de la firma de abogados ER se caracteriza por sus altos estándares de calidad, conocimiento y talento humano, lo cual genera tranquilidad y confianza. Muchas gracias por su conocimiento jurídico, el cual nos permite tener una operación en el día a día mucho más tranquila y segura.',
    },
    {
      id: 'ruben-pineda', author: 'Rubén D. Pineda C.', reference: 'Agencia de Seguros & Avalúos', monogram: 'RP',
      quote: 'ER Abogados me acompañó y me apoyó en un momento difícil de mi vida. En ellos encontré un grupo de profesionales con conocimientos jurídicos, actitud mental, acompañamiento, servicio y el mejor planteamiento estratégico, basado en el excelente levantamiento del material probatorio y la aplicación del mejor marco jurídico para llevar con éxito todo mi proceso legal y superar las expectativas en el resultado alcanzado.',
    },
    {
      id: 'lizbeth-casas', author: 'Lizbeth Casas Figueroa', reference: 'Gestión Predial · Grupo Cobra', monogram: 'LC',
      quote: 'Quiero expresar mi más sincero agradecimiento y reconocimiento a la firma ER Abogados por el excelente trabajo que ha realizado durante el desarrollo de nuestros proyectos de energías renovables. Su profesionalismo, compromiso, conocimiento jurídico y capacidad para afrontar los desafíos han sido fundamentales para alcanzar los objetivos propuestos. Pero, más allá de su excelencia técnica, deseo resaltar la calidad humana de cada uno de los integrantes de su equipo. Su disposición para colaborar, el compañerismo, el respeto y el apoyo permanente han sido un valioso respaldo para mi labor como responsable predial de los proyectos. Ha sido un verdadero privilegio trabajar de la mano con un equipo que demuestra que la excelencia profesional y los valores humanos pueden ir de la mano. Gracias por su dedicación, confianza y compromiso. Estoy convencida de que el trabajo conjunto seguirá dando grandes resultados y contribuyendo al desarrollo exitoso de los proyectos de energías renovables y a la seguridad energética de nuestro país. ¡Mi más profunda gratitud, cariño y reconocimiento para todo el equipo de ER Abogados!',
    },
  ],
} as const satisfies FirmProfileInput;
