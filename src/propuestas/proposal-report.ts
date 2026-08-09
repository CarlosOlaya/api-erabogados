import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces';
import { ER_AREAS, type ProposalSnapshot } from './propuesta.types';

interface ReportAssets {
  cover: string;
  logo: string;
  team: string;
}

const formatIssueDate = (): string =>
  new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

const selectedAreas = (proposal: ProposalSnapshot) =>
  ER_AREAS.filter((area) => proposal.areas[area.id]);

export const proposalPdfFileName = (proposal: ProposalSnapshot): string => {
  const company = proposal.client.company
    .replace(/[\\/:*?"<>|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60);

  return `Propuesta ${proposal.code}${company ? ` - ${company}` : ''}.pdf`;
};

export const getProposalReport = (
  proposal: ProposalSnapshot,
  assets: ReportAssets,
): TDocumentDefinitions => {
  const activeAreas = selectedAreas(proposal);
  const companyName = proposal.client.company || 'su empresa';
  const coverFontSize = companyName.length > 55 ? 23 : companyName.length > 36 ? 26 : 30;
  const noPaddingLayout = {
    hLineWidth: () => 0,
    vLineWidth: () => 0,
    paddingLeft: () => 0,
    paddingRight: () => 0,
    paddingTop: () => 0,
    paddingBottom: () => 0,
  };
  const serviceCards: Content[] = activeAreas.map((area) => (({
    table: {
      widths: ['*'],
      dontBreakRows: true,
      body: [[{
        stack: [
          { text: area.number, color: '#7c5b46', fontSize: 9, bold: true },
          { text: area.title, style: 'serviceTitle', margin: [0, 17, 0, 8] },
          { text: area.description, style: 'bodySmall' },
        ],
        margin: [0, 0, 0, 14],
      }]],
    },
    layout: noPaddingLayout,
  } as unknown) as Content));

  const methodCells = [
    ['01', 'Estudio', 'Confirmamos que el asunto sea defendible y justiciable.'],
    ['02', 'Estrategia', 'Integramos las áreas necesarias bajo una misma forma de trabajo.'],
    ['03', 'Trato directo', 'Servicio cercano con quien conoce y lleva el asunto.'],
    ['04', 'Defensa', 'Lo defendemos con método y objetivo de resultado.'],
  ].map(([number, title, description]) => ({
    stack: [
      { text: number, color: '#c7a284', fontSize: 8, bold: true },
      { text: title, color: '#ebe5e3', fontSize: 14, bold: true, margin: [0, 15, 0, 7] },
      { text: description, color: '#c8d0ce', fontSize: 8.5, lineHeight: 1.25 },
    ],
    margin: [0, 0, 8, 0],
  }));

  const cover: Content[] = [
    {
      image: assets.cover,
      width: 595.28,
      absolutePosition: { x: 0, y: 0 },
    },
    {
      canvas: [
        { type: 'rect', x: 0, y: 0, w: 595.28, h: 6, color: '#c7a284' },
      ],
      absolutePosition: { x: 0, y: 334 },
    },
    {
      image: assets.logo,
      fit: [118, 40],
      absolutePosition: { x: 40, y: 370 },
    },
    {
      text: 'PROPUESTA DE ACOMPAÑAMIENTO JURÍDICO',
      color: '#c7a284',
      fontSize: 8,
      bold: true,
      characterSpacing: 1.4,
      absolutePosition: { x: 40, y: 442 },
    },
    {
      columns: [{
        width: 500,
        text: `Para ${companyName}\nRigor técnico y decisiones con respaldo.`,
        color: '#ebe5e3',
        fontSize: coverFontSize,
        bold: true,
        lineHeight: 0.98,
      }],
      absolutePosition: { x: 40, y: 480 },
    },
    {
      columns: [{
        width: 270,
        text: `PREPARADA PARA ${proposal.client.recipient || 'SU EQUIPO'}`.toUpperCase(),
        color: '#c8d0ce',
        fontSize: 8,
        bold: true,
      }],
      absolutePosition: { x: 40, y: 702 },
    },
    {
      columns: [{
        width: 220,
        text: formatIssueDate().toUpperCase(),
        color: '#c8d0ce',
        fontSize: 8,
        bold: true,
        alignment: 'right',
      }],
      absolutePosition: { x: 335, y: 702 },
    },
    {
      text: 'ER ABOGADOS · RIGOR TÉCNICO. RESULTADOS CON RESPALDO.',
      color: '#80908d',
      fontSize: 7,
      bold: true,
      characterSpacing: 0.8,
      absolutePosition: { x: 40, y: 780 },
    },
    {
      text: ' ',
      color: '#152224',
      fontSize: 1,
      margin: [0, 680, 0, 0],
      pageBreak: 'after',
    },
  ];

  const methodBlock = ({
    table: {
      widths: ['*'],
      dontBreakRows: true,
      body: [[{
        stack: [
          {
            text: 'MÉTODO PROPIO',
            color: '#c7a284',
            fontSize: 8,
            bold: true,
            characterSpacing: 1.2,
            margin: [0, 0, 0, 10],
          },
          {
            text: 'Rigor, estrategia y trato directo.',
            color: '#ebe5e3',
            fontSize: 25,
            bold: true,
            margin: [0, 0, 0, 20],
          },
          { columns: methodCells },
        ],
        fillColor: '#1e3032',
        margin: [20, 22, 20, 22],
      }]],
    },
    layout: 'noBorders',
    margin: [0, 28, 0, 0],
  } as unknown) as Content;

  const investmentBlock: Content = {
    table: {
      widths: ['*'],
      body: [[{
        stack: [
          {
            text: 'INVERSIÓN',
            color: '#563d2c',
            fontSize: 8,
            bold: true,
            characterSpacing: 1.1,
          },
          {
            text: proposal.investment,
            color: '#422e20',
            fontSize: 13,
            bold: true,
            margin: [0, 10, 0, 0],
          },
        ],
        fillColor: '#f2ece5',
        margin: [16, 15, 16, 15],
      }]],
    },
    layout: 'noBorders',
  };

  const scopeBlock = ({
    table: {
      widths: ['*'],
      dontBreakRows: true,
      body: [[{
        stack: [
          { text: 'ALCANCE PROPUESTO', style: 'label', margin: [0, 0, 0, 10] },
          { text: proposal.scope, style: 'body' },
          { text: proposal.strategy, style: 'emphasis', margin: [0, 14, 0, 0] },
          {
            columns: [
              {
                width: '*',
                stack: [
                  { text: 'RESPONSABLE PROPUESTO', style: 'label' },
                  { text: proposal.responsible, style: 'body', margin: [0, 8, 0, 0] },
                ],
                margin: [0, 26, 15, 0],
              },
              {
                width: 180,
                stack: [investmentBlock],
                margin: [0, 26, 0, 0],
              },
            ],
          },
          { text: 'CONDICIONES', style: 'label', margin: [0, 26, 0, 10] },
          { text: proposal.conditions, style: 'bodySmall' },
        ],
      }]],
    },
    layout: noPaddingLayout,
    margin: [0, 30, 0, 0],
  } as unknown) as Content;

  const closingBlock = ({
    table: {
      widths: [185, '*'],
      dontBreakRows: true,
      body: [[
        {
          image: assets.team,
          fit: [185, 139],
          alignment: 'center',
        },
        {
          stack: [
            { text: 'SIGUIENTE PASO', color: '#c7a284', fontSize: 8, bold: true, characterSpacing: 1.2 },
            { text: 'Definamos juntos la ruta jurídica del asunto.', color: '#ebe5e3', fontSize: 18, bold: true, margin: [0, 13, 0, 8] },
            { text: 'ER Abogados · estudio, estrategia, trato directo y defensa.', color: '#c8d0ce', fontSize: 8.5 },
          ],
          fillColor: '#1e3032',
          margin: [18, 17, 18, 17],
        },
      ]],
    },
    layout: noPaddingLayout,
    margin: [0, 32, 0, 0],
  } as unknown) as Content;

  return {
    pageSize: 'A4',
    pageMargins: [40, 42, 40, 52],
    defaultStyle: { font: 'Roboto', color: '#262424' },
    background: (pageNumber, pageSize) => pageNumber === 1
      ? {
          canvas: [
            {
              type: 'rect',
              x: 0,
              y: 0,
              w: pageSize.width,
              h: pageSize.height,
              color: '#152224',
            },
          ],
        }
      : { text: '' },
    header: (pageNumber) => pageNumber > 2
      ? {
          columns: [
            { text: 'ER ABOGADOS · PROPUESTA', color: '#7c5b46', fontSize: 7, bold: true, characterSpacing: 1 },
            { text: proposal.code, color: '#7c5b46', fontSize: 7, bold: true, alignment: 'right' },
          ],
          margin: [40, 18, 40, 0],
        }
      : { text: '' },
    // @types/pdfmake 0.3 describe `Content` as a very strict discriminated
    // union. Esta composición usa pilas, columnas y celdas válidas en
    // pdfmake 0.2 (la misma versión de Foodly), pero TypeScript no conserva
    // correctamente la unión al expandir `serviceCards`.
    content: ([
      ...cover,
      {
        columns: [
          { image: assets.logo, fit: [110, 35] },
          {
            stack: [
              { text: proposal.code, alignment: 'right', color: '#563d2c', bold: true, fontSize: 10 },
              { text: 'ER Firma de Abogados y Asociados S.A.S.', alignment: 'right', style: 'small' },
            ],
          },
        ],
      },
      { text: 'PUNTO DE PARTIDA', style: 'label', margin: [0, 30, 0, 10] },
      { text: 'El asunto primero.', style: 'sectionTitle' },
      { text: proposal.context, style: 'body', margin: [0, 14, 0, 14] },
      { text: 'Estudio antes de aceptar: confirmamos que el asunto sea defendible y justiciable.', style: 'emphasis' },
      { text: 'ÁREAS DE PRÁCTICA SELECCIONADAS', style: 'label', margin: [0, 30, 0, 12] },
      { text: `${activeAreas.length} áreas activas para este asunto.`, style: 'small', margin: [0, 0, 0, 14] },
      ...serviceCards,
      methodBlock,
      scopeBlock,
      closingBlock,
    ] as unknown) as Content[],
    styles: {
      label: { color: '#563d2c', fontSize: 8, bold: true, characterSpacing: 1.2 },
      sectionTitle: { color: '#262424', fontSize: 30, bold: true, lineHeight: 1 },
      body: { color: '#444141', fontSize: 10.5, lineHeight: 1.5 },
      bodySmall: { color: '#605d5d', fontSize: 8.5, lineHeight: 1.35 },
      emphasis: { color: '#262424', fontSize: 9.5, bold: true, lineHeight: 1.35 },
      serviceTitle: { color: '#262424', fontSize: 15, bold: true, lineHeight: 1.05 },
      small: { color: '#605d5d', fontSize: 8.5 },
    },
    footer: (page, pages) => page === 1
      ? { text: '' }
      : {
          columns: [
            { text: 'ER Abogados · rigor técnico, método y estrategia', style: 'small', margin: [40, 0, 0, 0] },
            { text: `${page} / ${pages}`, alignment: 'right', style: 'small', margin: [0, 0, 40, 0] },
          ],
          margin: [0, 18, 0, 0],
        },
  };
};
