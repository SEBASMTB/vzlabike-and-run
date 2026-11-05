import { Resend } from "resend";

const FROM_EMAIL = process.env.FROM_EMAIL || "venezuelabikeandrun@gmail.com";
const FROM_NAME = process.env.FROM_NAME || "Venezuela Bike and Run";
const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://vzlabikeandrun.com";

interface EmailRegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  eventDistance: string;
  category: string;
  paymentMethod: string;
}

function generatePreRegistrationHTML(data: EmailRegistrationData): string {
  const formattedDate = new Date(data.eventDate).toLocaleDateString("es-VE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const paymentLabels: Record<string, string> = {
    binance: "Binance (USDT)",
    zelle: "Zelle",
    pago_movil: "Pago Movil",
    transferencia: "Transferencia Bancaria",
    efectivo: "Efectivo",
  };

  const paymentLabel = paymentLabels[data.paymentMethod] || data.paymentMethod;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pre-Registro Confirmado - ${data.eventTitle}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: Arial, Helvetica, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">

          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">
                VzlaBike and Run
              </h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.7); font-size: 14px;">
                Confirmacion de Pre-Registro
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #333333;">
                Hola <strong>${data.firstName} ${data.lastName}</strong>,
              </p>
              <p style="margin: 0 0 24px 0; font-size: 16px; color: #555555; line-height: 1.6;">
                Hemos recibido tu pre-registro con exito para el siguiente evento:
              </p>

              <!-- Event Card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #1a1a2e;">
                      ${data.eventTitle}
                    </h2>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                          <span style="color: #888888; font-size: 13px;">FECHA</span><br>
                          <span style="color: #333333; font-size: 15px; font-weight: 600;">${formattedDate}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                          <span style="color: #888888; font-size: 13px;">UBICACION</span><br>
                          <span style="color: #333333; font-size: 15px; font-weight: 600;">${data.eventLocation}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                          <span style="color: #888888; font-size: 13px;">DISTANCIA</span><br>
                          <span style="color: #333333; font-size: 15px; font-weight: 600;">${data.eventDistance}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                          <span style="color: #888888; font-size: 13px;">CATEGORIA</span><br>
                          <span style="color: #333333; font-size: 15px; font-weight: 600;">${data.category}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #888888; font-size: 13px;">METODO DE PAGO</span><br>
                          <span style="color: #333333; font-size: 15px; font-weight: 600;">${paymentLabel}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Important Notice -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #fffbeb; border-radius: 8px; border: 1px solid #fbbf24; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                      <strong>Aviso Importante:</strong> En un lapso de 24 a 48 horas recibiras la confirmacion definitiva de tu inscripcion al evento. Si tienes alguna duda, puedes contactarnos a traves de nuestro WhatsApp.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 8px 0; font-size: 14px; color: #777777; line-height: 1.6;">
                Asegurate de haber completado tu metodo de pago correspondiente para garantizar tu cupo en el evento.
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; color: #777777; line-height: 1.6;">
                Te esperamos en la linea de partida. Mucha suerte!
              </p>

              <!-- WhatsApp Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="https://wa.me/584120162685" style="display: inline-block; background-color: #25d366; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                      Contactanos por WhatsApp
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 40px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0 0 4px 0; font-size: 14px; color: #333333; font-weight: 600;">
                VzlaBike and Run
              </p>
              <p style="margin: 0 0 4px 0; font-size: 12px; color: #999999;">
                ${FROM_EMAIL}
              </p>
              <p style="margin: 0; font-size: 12px; color: #bbb;">
                <a href="${SITE_URL}" style="color: #0f3460; text-decoration: none;">${SITE_URL}</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendPreRegistrationEmail(data: EmailRegistrationData): Promise<boolean> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log("Email: RESEND_API_KEY no configurada, saltando envio de correo");
      return false;
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [data.email],
      subject: `Pre-Registro Confirmado - ${data.eventTitle}`,
      html: generatePreRegistrationHTML(data),
    });

    console.log(`Email de pre-registro enviado a ${data.email} para ${data.eventTitle}`);
    return true;
  } catch (error) {
    console.error("Error enviando email de pre-registro:", error);
    return false;
  }
}
