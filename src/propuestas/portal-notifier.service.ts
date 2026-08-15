import { Injectable, Logger } from '@nestjs/common';

/**
 * Que el cliente abra el portal es la señal de compra más fuerte del ciclo, y
 * hasta ahora nadie se enteraba: había que entrar al estudio y mirar un
 * contador. Esto avisa al equipo en el momento en que ocurre.
 *
 * El destino es un webhook configurable (`PORTAL_NOTIFY_WEBHOOK`): sirve para
 * Slack, Make, n8n o cualquier automatización que ya use la firma, sin obligar
 * a montar correo saliente.
 */
@Injectable()
export class PortalNotifier {
  private readonly logger = new Logger(PortalNotifier.name);

  /**
   * Un cliente revisa la propuesta varias veces seguidas. Avisar en cada carga
   * convertiría la señal en ruido y el equipo dejaría de mirarla.
   */
  private static readonly QUIET_PERIOD_MS = 6 * 60 * 60 * 1000;

  shouldNotify(previousViewAt: Date | null | undefined): boolean {
    if (!process.env.PORTAL_NOTIFY_WEBHOOK?.trim()) return false;
    if (!previousViewAt) return true;

    return Date.now() - previousViewAt.getTime() > PortalNotifier.QUIET_PERIOD_MS;
  }

  /**
   * Deliberadamente sin `await` en quien llama: el portal del cliente no puede
   * quedarse esperando —ni fallar— por una integración interna.
   */
  notify(payload: {
    company: string;
    recipient: string;
    code: string;
    version: number;
    viewCount: number;
    isFirstView: boolean;
  }): void {
    const webhook = process.env.PORTAL_NOTIFY_WEBHOOK?.trim();
    if (!webhook) return;

    const headline = payload.isFirstView
      ? `${payload.company} abrió la propuesta ${payload.code} por primera vez.`
      : `${payload.company} volvió a abrir la propuesta ${payload.code}.`;

    void fetch(webhook, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        // `text` es lo que Slack y la mayoría de automatizaciones leen directo.
        text: `${headline} Dirigida a ${payload.recipient}. Apertura n.º ${payload.viewCount}.`,
        evento: 'portal.abierto',
        empresa: payload.company,
        destinatario: payload.recipient,
        codigo: payload.code,
        version: payload.version,
        aperturas: payload.viewCount,
        primeraApertura: payload.isFirstView,
        ocurridoEn: new Date().toISOString(),
      }),
    }).catch((error: unknown) => {
      this.logger.warn(
        `No fue posible avisar la apertura de ${payload.code}: ${String(error)}`,
      );
    });
  }
}
