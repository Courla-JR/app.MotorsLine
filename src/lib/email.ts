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

// ─── Status change email ──────────────────────────────────

const STATUS_LABELS_FR: Record<string, string> = {
  a_faire:  "Planifiée",
  en_cours: "En cours",
  terminee: "Livrée",
  annulee:  "Annulée",
};

export interface StatusChangeEmailData {
  to: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehiclePlate: string;
  oldStatus: string;
  newStatus: string;
  missionId: string;
}

export function buildStatusChangeEmail(data: StatusChangeEmailData): string {
  const oldLabel = STATUS_LABELS_FR[data.oldStatus] ?? data.oldStatus;
  const newLabel = STATUS_LABELS_FR[data.newStatus] ?? data.newStatus;
  const missionUrl = `https://app.motorsline.fr/client/missions/${data.missionId}`;

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
                Mise à jour de votre mission
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:36px;">
              <p style="margin:0;font-size:14px;color:#888;font-family:Helvetica,sans-serif;line-height:1.6;">
                Le statut de votre mission pour <strong style="color:#e5e2e1;">${data.vehicleBrand} ${data.vehicleModel} — ${data.vehiclePlate}</strong> vient d'être mis à jour.
              </p>
            </td>
          </tr>

          <!-- Status card -->
          <tr>
            <td style="background:#141414;border-radius:16px;padding:32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:45%;text-align:center;padding:20px;background:#1e1e1e;border-radius:12px;">
                    <p style="margin:0 0 6px;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#555;font-family:Helvetica,sans-serif;">Avant</p>
                    <p style="margin:0;font-size:16px;font-weight:700;color:#949493;font-family:Helvetica,sans-serif;">${oldLabel}</p>
                  </td>
                  <td style="width:10%;text-align:center;padding:0 8px;">
                    <span style="font-size:20px;color:#555;">→</span>
                  </td>
                  <td style="width:45%;text-align:center;padding:20px;background:#1e1e1e;border-radius:12px;">
                    <p style="margin:0 0 6px;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#555;font-family:Helvetica,sans-serif;">Maintenant</p>
                    <p style="margin:0;font-size:16px;font-weight:700;color:#ffffff;font-family:Helvetica,sans-serif;">${newLabel}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding-top:32px;text-align:center;">
              <a href="${missionUrl}" style="display:inline-block;padding:14px 32px;background:#ffffff;color:#0A0A0A;font-size:14px;font-weight:700;font-family:Helvetica,sans-serif;border-radius:100px;text-decoration:none;">
                Voir la mission
              </a>
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

export async function sendStatusChangeEmail(data: StatusChangeEmailData): Promise<{ error: unknown }> {
  const newLabel = STATUS_LABELS_FR[data.newStatus] ?? data.newStatus;
  const from = process.env.RESEND_FROM_EMAIL
    ? `Motors Line <${process.env.RESEND_FROM_EMAIL}>`
    : "Motors Line <onboarding@resend.dev>";
  const { error } = await resend.emails.send({
    from,
    to: data.to,
    subject: `Mission ${newLabel.toLowerCase()} — ${data.vehicleBrand} ${data.vehicleModel}`,
    html: buildStatusChangeEmail(data),
  });
  if (error) console.error("[Resend] sendStatusChangeEmail error:", error);
  return { error: error ?? null };
}

// ─── Delivery recap email ─────────────────────────────────

export interface DeliveryRecapEmailData {
  to: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehiclePlate: string;
  pickupAddress: string;
  deliveryAddress: string;
  distance: string | null;
  duration: string | null;
  deliveryDate: string | null;
  price: number | null;
  serviceLevel: string | null;
  missionId: string;
  beforePhotoUrls: string[];
  afterPhotoUrls: string[];
}

export function buildDeliveryRecapEmail(data: DeliveryRecapEmailData): string {
  const missionUrl = `https://app.motorsline.fr/client/missions/${data.missionId}`;
  const priceText = data.price !== null ? `${data.price}€ HT` : "Sur devis";
  const deliveryText = data.deliveryDate
    ? new Date(data.deliveryDate).toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : new Date().toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const photoRow = (urls: string[], label: string) => {
    if (!urls.length) return "";
    return `
      <tr>
        <td colspan="2" style="padding-top:20px;padding-bottom:8px;">
          <span style="font-size:10px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#555;font-family:Helvetica,sans-serif;">${label}</span>
        </td>
      </tr>
      <tr>
        <td colspan="2" style="padding-bottom:8px;">
          <table cellpadding="0" cellspacing="4" style="width:100%;">
            <tr>
              ${urls.slice(0, 3).map(url => `
                <td style="width:33%;">
                  <a href="${url}" target="_blank" style="display:block;">
                    <img src="${url}" width="160" style="width:100%;max-width:160px;height:100px;object-fit:cover;border-radius:8px;display:block;" />
                  </a>
                </td>
              `).join("")}
            </tr>
          </table>
        </td>
      </tr>`;
  };

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
                Votre véhicule a été livré ✓
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:36px;">
              <p style="margin:0;font-size:14px;color:#888;font-family:Helvetica,sans-serif;line-height:1.6;">
                Votre mission de convoyage est terminée. Voici le récapitulatif complet.
              </p>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#141414;border-radius:16px;padding:28px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">

                <!-- Véhicule -->
                <tr>
                  <td colspan="2" style="padding-bottom:8px;">
                    <span style="font-size:10px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#555;font-family:Helvetica,sans-serif;">Véhicule</span>
                  </td>
                </tr>
                ${row("Marque / Modèle", `${data.vehicleBrand} ${data.vehicleModel}`)}
                ${row("Immatriculation", data.vehiclePlate)}

                <!-- Itinéraire -->
                <tr>
                  <td colspan="2" style="padding-top:24px;padding-bottom:8px;">
                    <span style="font-size:10px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#555;font-family:Helvetica,sans-serif;">Itinéraire</span>
                  </td>
                </tr>
                ${row("Départ", data.pickupAddress)}
                ${row("Livraison", data.deliveryAddress)}
                ${data.distance ? row("Distance", data.distance) : ""}
                ${data.duration ? row("Durée", data.duration) : ""}
                ${row("Livré le", deliveryText)}

                <!-- Photos avant -->
                ${photoRow(data.beforePhotoUrls, "Photos — Prise en charge")}

                <!-- Photos après -->
                ${photoRow(data.afterPhotoUrls, "Photos — Livraison")}

              </table>

              <!-- Price -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;background:#1e1e1e;border-radius:12px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <span style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#666;font-family:Helvetica,sans-serif;">Tarif</span>
                    <br/>
                    <span style="font-size:36px;font-weight:700;color:#ffffff;font-family:Helvetica,sans-serif;letter-spacing:-0.03em;">${priceText}</span>
                    ${data.serviceLevel ? `<br/><span style="font-size:11px;color:#555;font-family:Helvetica,sans-serif;">${formatServiceLevel(data.serviceLevel)}</span>` : ""}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding-top:32px;text-align:center;">
              <a href="${missionUrl}" style="display:inline-block;padding:14px 32px;background:#ffffff;color:#0A0A0A;font-size:14px;font-weight:700;font-family:Helvetica,sans-serif;border-radius:100px;text-decoration:none;">
                Voir le détail de la mission
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:48px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#555;font-family:Helvetica,sans-serif;letter-spacing:0.06em;text-transform:uppercase;">
                Par des pros. Pour des pros.
              </p>
              <p style="margin:4px 0 0;font-size:11px;color:#333;font-family:Helvetica,sans-serif;">
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

export async function sendDeliveryRecapEmail(data: DeliveryRecapEmailData): Promise<{ error: unknown }> {
  const from = process.env.RESEND_FROM_EMAIL
    ? `Motors Line <${process.env.RESEND_FROM_EMAIL}>`
    : "Motors Line <onboarding@resend.dev>";
  const { error } = await resend.emails.send({
    from,
    to: data.to,
    subject: `Livraison confirmée — ${data.vehicleBrand} ${data.vehicleModel} · ${data.vehiclePlate}`,
    html: buildDeliveryRecapEmail(data),
  });
  if (error) console.error("[Resend] sendDeliveryRecapEmail error:", error);
  return { error: error ?? null };
}
