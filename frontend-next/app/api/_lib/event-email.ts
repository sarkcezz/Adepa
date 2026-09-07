import { sendEmail } from "./notify";
import { formatGhs } from "@/lib/format";

const LOGO_URL = "https://www.adepaporkhub.shop/images/Adepa_logo.JPEG";
const SITE_URL = "https://www.adepaporkhub.shop";

function formatEventDate(dateStr: string, timeStr: string): string {
  const [h, m] = timeStr.slice(0, 5).split(":").map(Number);
  const date = new Date(`${dateStr}T00:00:00`);
  const dateLabel = date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${dateLabel} · ${h12}:${String(m).padStart(2, "0")} ${period}`;
}

/** Sends the branded booking-confirmation email. Never throws — a delivery failure shouldn't fail the booking. */
export async function sendEventConfirmationEmail(to: string, opts: {
  eventName: string;
  eventDate: string;
  eventTime: string;
  venueName: string;
  venueAddress: string;
  attendeeName: string;
  companions: string[];
  flatRateKobo: number;
  paid: boolean;
  managementCode: string;
}) {
  const { eventName, eventDate, eventTime, venueName, venueAddress, attendeeName, companions, flatRateKobo, paid, managementCode } = opts;
  const partySize = 1 + companions.length;
  const total = flatRateKobo * partySize;
  const manageUrl = `${SITE_URL}/events/manage/${managementCode}`;
  const isFree = flatRateKobo === 0;

  const guestRows = [attendeeName, ...companions]
    .map((name, i) => `<tr><td style="padding:6px 0;font-size:14px;color:#34251b;border-bottom:${i === companions.length ? "none" : "1px dashed #d9c7b0"}">${i === 0 ? name + " (you)" : name}</td></tr>`)
    .join("");

  const text = `You're booked for ${eventName}!\n\n${formatEventDate(eventDate, eventTime)}\n${venueName}${venueAddress ? ", " + venueAddress : ""}\n\nParty of ${partySize}: ${[attendeeName, ...companions].join(", ")}\n\n${isFree ? "Free entry." : `${formatGhs(flatRateKobo)} per person — pay cash at the event. Total: ${formatGhs(total)}.`}\n\nYour booking code: ${managementCode}\nManage this booking: ${manageUrl}\n\n— Adepa Pork Hub`;

  const html = `
<div style="background:#f4e9d8;padding:32px 16px;font-family:Georgia,serif;">
  <table role="presentation" width="100%" style="max-width:520px;margin:0 auto;background:#fbf5ea;border-radius:20px;overflow:hidden;border:1px solid #d9c7b0;">
    <tr><td style="padding:24px 28px;border-bottom:1px solid #d9c7b0;">
      <table role="presentation" width="100%"><tr>
        <td width="44"><img src="${LOGO_URL}" width="40" height="40" alt="Adepa Pork Hub" style="border-radius:10px;display:block;"></td>
        <td style="padding-left:12px;font-family:Arial,sans-serif;">
          <div style="font-family:Georgia,serif;font-weight:bold;font-size:16px;color:#34251b;">Adepa Pork Hub</div>
          <div style="font-size:11px;color:#8a7460;">A Symas Group company</div>
        </td>
        <td align="right" style="font-family:Arial,sans-serif;">
          <span style="display:inline-block;background:#eef0e0;color:#6f7a3f;font-size:11px;font-weight:bold;letter-spacing:0.05em;text-transform:uppercase;padding:5px 10px;border-radius:999px;">Confirmed</span>
        </td>
      </tr></table>
    </td></tr>

    <tr><td style="padding:24px 28px 8px;">
      <div style="font-family:Arial,sans-serif;font-size:11px;font-weight:bold;letter-spacing:0.1em;text-transform:uppercase;color:#b15a34;margin-bottom:6px;">Booking confirmation</div>
      <div style="font-size:24px;font-weight:bold;color:#34251b;">${eventName}</div>
      <table role="presentation" width="100%" style="margin-top:16px;font-family:Arial,sans-serif;">
        <tr>
          <td width="50%" style="padding-bottom:12px;">
            <div style="font-size:10px;font-weight:bold;letter-spacing:0.08em;text-transform:uppercase;color:#8a7460;">Date &amp; time</div>
            <div style="font-size:14px;color:#34251b;margin-top:2px;">${formatEventDate(eventDate, eventTime)}</div>
          </td>
          <td width="50%" style="padding-bottom:12px;">
            <div style="font-size:10px;font-weight:bold;letter-spacing:0.08em;text-transform:uppercase;color:#8a7460;">Venue</div>
            <div style="font-size:14px;color:#34251b;margin-top:2px;">${venueName}${venueAddress ? `<br>${venueAddress}` : ""}</div>
          </td>
        </tr>
      </table>
    </td></tr>

    <tr><td style="padding:4px 28px;">
      <div style="font-family:Arial,sans-serif;font-size:10px;font-weight:bold;letter-spacing:0.1em;text-transform:uppercase;color:#8a7460;border-top:1px solid #d9c7b0;padding-top:14px;">Party of ${partySize}</div>
      <table role="presentation" width="100%" style="margin-top:8px;font-family:Arial,sans-serif;">${guestRows}</table>
    </td></tr>

    <tr><td style="padding:18px 28px;">
      <table role="presentation" width="100%" style="background:#eee0c9;border:1px solid #d9c7b0;border-radius:14px;">
        <tr>
          <td style="padding:14px 16px;font-family:Arial,sans-serif;">
            <div style="font-size:10px;font-weight:bold;letter-spacing:0.08em;text-transform:uppercase;color:#8a7460;">Payment</div>
            <div style="font-size:12px;color:#5c4a3a;margin-top:2px;">${isFree ? "Free entry" : `${formatGhs(flatRateKobo)} × ${partySize} — pay cash at the event`}</div>
          </td>
          <td align="right" style="padding:14px 16px;font-family:Georgia,serif;font-size:22px;font-weight:bold;color:#7b4530;white-space:nowrap;">
            ${isFree ? "FREE" : formatGhs(total)}
          </td>
        </tr>
      </table>
    </td></tr>

    <tr><td style="padding:0 28px;"><div style="border-top:2px dashed #c3ac8d;"></div></td></tr>

    <tr><td style="padding:20px 28px;font-family:Arial,sans-serif;">
      <div style="font-size:10px;font-weight:bold;letter-spacing:0.08em;text-transform:uppercase;color:#8a7460;">Your booking code</div>
      <div style="font-family:'Courier New',monospace;font-size:22px;font-weight:bold;letter-spacing:0.12em;color:#7b4530;background:#eef0e0;border:1.5px solid #6f7a3f;border-radius:10px;padding:10px 14px;display:inline-block;margin-top:6px;">${managementCode}</div>
      <div style="font-size:12px;color:#5c4a3a;margin-top:10px;">Keep this code to view, edit, or cancel your booking — no account needed.</div>
      <div style="margin-top:10px;"><a href="${manageUrl}" style="font-size:13px;color:#b15a34;">Manage this booking →</a></div>
    </td></tr>

    <tr><td style="padding:16px 28px 24px;border-top:1px solid #d9c7b0;font-family:Arial,sans-serif;">
      <div style="font-size:12px;font-weight:bold;color:#5c4a3a;">Questions? WhatsApp us anytime.</div>
      <div style="font-size:11px;color:#8a7460;margin-top:4px;line-height:1.6;">
        Ejisu-Krapa, Ashanti Region, Ghana · <a href="https://wa.me/233240425561" style="color:#b15a34;">wa.me/233240425561</a> · <a href="mailto:orders@adepaporkhub.shop" style="color:#b15a34;">orders@adepaporkhub.shop</a><br>
        Pork sourced fresh from Symas Farms.
      </div>
    </td></tr>
  </table>
</div>`;

  await sendEmail(to, `You're booked for ${eventName}`, text, html);
}
