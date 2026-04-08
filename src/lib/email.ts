import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

// ─── Invitation email ─────────────────────────────────────

export interface InvitationEmailData {
  email: string;
  company_name: string;
  inviteUrl: string;
}

export function buildInvitationEmail({ company_name, inviteUrl }: InvitationEmailData): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0A0A0A;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A;min-height:100vh;">
    <tr>
      <td align="center" style="padding:48px 16px;">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Logo -->
          <tr>
            <td style="padding-bottom:40px;">
              <span style="font-size:22px;font-weight:700;font-style:italic;letter-spacing:-0.04em;font-family:Helvetica,sans-serif;color:#c0c0c0;">
                Motors Line
              </span>
            </td>
          </tr>

          <!-- Heading -->
          <tr>
            <td style="padding-bottom:8px;">
              <h1 style="margin:0;font-size:26px;font-weight:700;color:#ffffff;font-family:Helvetica,sans-serif;letter-spacing:-0.02em;">
                Votre espace client vous attend
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:36px;">
              <p style="margin:0;font-size:14px;color:#888;font-family:Helvetica,sans-serif;line-height:1.6;">
                L'équipe Motors Line a créé un compte pour <strong style="color:#e5e2e1;">${company_name}</strong>.
                Cliquez sur le bouton ci-dessous pour choisir votre mot de passe et accéder à votre espace.
              </p>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#141414;border-radius:16px;padding:32px;">
              <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#555;font-family:Helvetica,sans-serif;">
                Lien d'invitation
              </p>
              <p style="margin:0 0 24px;font-size:13px;color:#666;font-family:Helvetica,sans-serif;word-break:break-all;">
                ${inviteUrl}
              </p>
              <a href="${inviteUrl}"
                 style="display:inline-block;padding:14px 32px;background:#ffffff;color:#0A0A0A;font-size:14px;font-weight:700;font-family:Helvetica,sans-serif;border-radius:100px;text-decoration:none;letter-spacing:-0.01em;">
                Créer mon mot de passe
              </a>
              <p style="margin:24px 0 0;font-size:12px;color:#444;font-family:Helvetica,sans-serif;">
                Ce lien expire dans 7 jours et n'est valable qu'une seule fois.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:48px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#333;font-family:Helvetica,sans-serif;letter-spacing:0.06em;text-transform:uppercase;">
                Motors Line — Transport premium de véhicules
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

export async function sendInvitationEmail(data: InvitationEmailData) {
  const { error } = await resend.emails.send({
    from: "Motors Line <invitations@motorsline.fr>",
    to: data.email,
    subject: `Votre invitation Motors Line — ${data.company_name}`,
    html: buildInvitationEmail(data),
  });
  if (error) console.error("[Resend] Failed to send invitation email:", error);
  return { error };
}

export interface MissionEmailData {
  to: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehiclePlate: string;
  pickupAddress: string;
  deliveryAddress: string;
  distance: string;
  duration: string;
  serviceLevel: string;
  price: number | null;
  pickupDate: string | null;
}

function formatServiceLevel(level: string): string {
  if (level === "essentiel") return "Essentiel — Convoyage point à point";
  if (level === "premium")   return "Premium — Livraison avec mise en main";
  return "Sur Mesure — Tarif sur devis";
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function row(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #1f1f1f;color:#888;font-size:12px;font-family:Helvetica,sans-serif;letter-spacing:0.08em;text-transform:uppercase;width:40%;">
        ${label}
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #1f1f1f;color:#e5e2e1;font-size:14px;font-family:Helvetica,sans-serif;font-weight:600;">
        ${value}
      </td>
    </tr>`;
}

export function buildMissionEmail(data: MissionEmailData): string {
  const priceText = data.price !== null ? `${data.price}€ HT` : "Sur devis";

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0A0A0A;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A;min-height:100vh;">
    <tr>
      <td align="center" style="padding:48px 16px;">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Logo -->
          <tr>
            <td style="padding-bottom:40px;">
              <span style="font-size:22px;font-weight:700;font-style:italic;letter-spacing:-0.04em;font-family:Helvetica,sans-serif;background:linear-gradient(135deg,#888,#e0e0e0,#888);-webkit-background-clip:text;color:#c0c0c0;">
                Motors Line
              </span>
            </td>
          </tr>

          <!-- Heading -->
          <tr>
            <td style="padding-bottom:8px;">
              <h1 style="margin:0;font-size:26px;font-weight:700;color:#ffffff;font-family:Helvetica,sans-serif;letter-spacing:-0.02em;">
                Mission créée avec succès
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:36px;">
              <p style="margin:0;font-size:14px;color:#888;font-family:Helvetica,sans-serif;line-height:1.6;">
                Votre mission de convoyage a bien été enregistrée. Voici le récapitulatif.
              </p>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#141414;border-radius:16px;padding:28px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">

                <!-- Section: Véhicule -->
                <tr>
                  <td colspan="2" style="padding-bottom:8px;">
                    <span style="font-size:10px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#555;font-family:Helvetica,sans-serif;">
                      Véhicule
                    </span>
                  </td>
                </tr>
                ${row("Marque / Modèle", `${data.vehicleBrand} ${data.vehicleModel}`)}
                ${row("Immatriculation", data.vehiclePlate)}

                <!-- Section: Itinéraire -->
                <tr>
                  <td colspan="2" style="padding-top:24px;padding-bottom:8px;">
                    <span style="font-size:10px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#555;font-family:Helvetica,sans-serif;">
                      Itinéraire
                    </span>
                  </td>
                </tr>
                ${row("Départ", data.pickupAddress)}
                ${row("Arrivée", data.deliveryAddress)}
                ${row("Distance", data.distance)}
                ${row("Durée estimée", data.duration)}
                ${data.pickupDate ? row("Date prévue", formatDate(data.pickupDate)) : ""}

                <!-- Section: Service -->
                <tr>
                  <td colspan="2" style="padding-top:24px;padding-bottom:8px;">
                    <span style="font-size:10px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#555;font-family:Helvetica,sans-serif;">
                      Service
                    </span>
                  </td>
                </tr>
                ${row("Niveau", formatServiceLevel(data.serviceLevel))}

              </table>

              <!-- Price highlight -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;background:#1e1e1e;border-radius:12px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <span style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#666;font-family:Helvetica,sans-serif;">
                      Tarif estimé
                    </span>
                    <br/>
                    <span style="font-size:36px;font-weight:700;color:#ffffff;font-family:Helvetica,sans-serif;letter-spacing:-0.03em;">
                      ${priceText}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding-top:32px;text-align:center;">
              <a href="https://app.motorsline.fr/missions" style="display:inline-block;padding:14px 32px;background:#ffffff;color:#0A0A0A;font-size:14px;font-weight:700;font-family:Helvetica,sans-serif;border-radius:100px;text-decoration:none;letter-spacing:-0.01em;">
                Voir mes missions
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:48px;text-align:center;border-top:1px solid #1a1a1a;margin-top:48px;">
              <p style="margin:16px 0 4px;font-size:12px;color:#555;font-family:Helvetica,sans-serif;letter-spacing:0.06em;text-transform:uppercase;">
                Par des pros. Pour des pros.
              </p>
              <p style="margin:0;font-size:11px;color:#333;font-family:Helvetica,sans-serif;">
                Motors Line — Transport premium de véhicules
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

export async function sendMissionCreatedEmail(data: MissionEmailData) {
  const { error } = await resend.emails.send({
    from: "Motors Line <missions@motorsline.fr>",
    to: data.to,
    subject: `Mission créée — ${data.vehicleBrand} ${data.vehicleModel} · ${data.pickupAddress.split(",")[0]} → ${data.deliveryAddress.split(",")[0]}`,
    html: buildMissionEmail(data),
  });
  if (error) console.error("[Resend] Failed to send mission email:", error);
}
