import nodemailer from "nodemailer";

let transporter;
function getTransporter() {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 465);
    transporter = nodemailer.createTransport({
      host: (process.env.SMTP_HOST || "smtp.gmail.com").trim(),
      port,
      secure: port === 465,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      auth: {
        user: (process.env.SMTP_USER || "").trim(),
        // Gmail shows app passwords as "abcd efgh ijkl mnop" - the spaces must be removed
        pass: (process.env.SMTP_PASS || "").replace(/\s+/g, ""),
      },
    });
  }
  return transporter;
}

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const oneLine = (s) => String(s).replace(/[\r\n"]+/g, " ").trim();

// Resend (https://resend.com): no Gmail password needed, just RESEND_API_KEY.
// Without a verified domain Resend only delivers to the email you signed up with - which is you.
async function sendViaResend({ name, email, phone, message }) {
  const to = (process.env.CONTACT_TO || "").trim();
  if (!to) throw new Error("CONTACT_TO is missing (use the email you signed up to Resend with)");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY.trim()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Portfolio Contact <onboarding@resend.dev>",
      to: [to],
      reply_to: email,
      subject: `New portfolio message from ${oneLine(name)}`,
      text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone || "-"}\n\n${message}`,
      html: `<h3>New portfolio message</h3>
<p><b>Name:</b> ${esc(name)}<br><b>Email:</b> ${esc(email)}<br><b>Phone:</b> ${esc(phone || "-")}</p>
<p style="white-space:pre-wrap">${esc(message)}</p>`,
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

// Sends the message to you, then a thank-you copy to the visitor (SMTP only).
export async function sendMails({ name, email, phone, message }) {
  if (process.env.RESEND_API_KEY) return sendViaResend({ name, email, phone, message });
  const u = process.env.SMTP_USER || "";
  if (!u || !process.env.SMTP_PASS || u.includes("yourgmail")) throw new Error("SMTP_USER / SMTP_PASS missing or still placeholders in .env.local");
  const t = getTransporter();
  const owner = (process.env.CONTACT_TO || process.env.SMTP_USER).trim();

  await t.sendMail({
    from: { name: "Portfolio Contact", address: process.env.SMTP_USER.trim() },
    to: owner,
    replyTo: { name: oneLine(name), address: email }, // just press Reply to answer the visitor
    subject: `New portfolio message from ${oneLine(name)}`,
    text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone || "-"}\n\n${message}`,
    html: `<h3>New portfolio message</h3>
<p><b>Name:</b> ${esc(name)}<br><b>Email:</b> ${esc(email)}<br><b>Phone:</b> ${esc(phone || "-")}</p>
<p style="white-space:pre-wrap">${esc(message)}</p>`,
  });

  if (process.env.AUTO_REPLY !== "false") {
    try {
      await t.sendMail({
        from: { name: "Ayesha Tariq", address: process.env.SMTP_USER.trim() },
        to: email,
        subject: "Thanks for your message",
        text: `Hi ${oneLine(name)},\n\nThank you for contacting me. I received your message and will reply soon.\n\nAyesha Tariq\nFull Stack Developer`,
      });
    } catch (e) {
      console.error("Auto-reply failed:", e.message); // never fail the request because of this
    }
  }
}
