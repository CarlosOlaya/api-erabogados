import { Injectable } from '@nestjs/common';
import { existsSync, readFileSync } from 'node:fs';
import * as path from 'node:path';
import type { TDocumentDefinitions } from 'pdfmake/interfaces';

// Mismo motor server-side de Foodly: pdfmake genera un Buffer, nunca una
// captura del navegador. Se mantiene como require porque ese módulo no expone
// una importación ESM tipada en pdfmake 0.2.x.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PdfPrinter = require('pdfmake/src/printer');

const assetPath = (...segments: string[]): string => {
  const sourcePath = path.join(process.cwd(), 'src', 'assets', ...segments);
  if (existsSync(sourcePath)) return sourcePath;
  return path.join(process.cwd(), 'dist', 'assets', ...segments);
};

const fonts = {
  Roboto: {
    normal: assetPath('fonts', 'Roboto', 'Roboto-Regular.ttf'),
    bold: assetPath('fonts', 'Roboto', 'Roboto-Medium.ttf'),
    italics: assetPath('fonts', 'Roboto', 'Roboto-Italic.ttf'),
    bolditalics: assetPath('fonts', 'Roboto', 'Roboto-MediumItalic.ttf'),
  },
};

@Injectable()
export class PdfPrinterService {
  render(document: TDocumentDefinitions): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const printer = new PdfPrinter(fonts);
      const pdfDocument = printer.createPdfKitDocument(document, {});
      const chunks: Buffer[] = [];

      pdfDocument.on('data', (chunk: Buffer) => chunks.push(chunk));
      pdfDocument.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDocument.on('error', (error: Error) => reject(error));
      pdfDocument.end();
    });
  }

  imageDataUri(fileName: string): string {
    const filePath = assetPath(fileName);
    const extension = path.extname(fileName).toLowerCase();
    const mime = extension === '.jpg' || extension === '.jpeg' ? 'image/jpeg' : 'image/png';
    return `data:${mime};base64,${readFileSync(filePath).toString('base64')}`;
  }
}
