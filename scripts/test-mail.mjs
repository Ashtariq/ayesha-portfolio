// Run:  npm run test:mail     (checks your .env.local email + database settings)
import nodemailer from "nodemailer";
import { MongoClient } from "mongodb";

const env = process.env;
console.log("SMTP_USER:", env.SMTP_USER || "(missing)");
console.log("SMTP_PASS:", env.SMTP_PASS ? `set (${env.SMTP_PASS.replace(/\s+/g, "").length} chars, Gmail app passwords have 16)` : "(missing)");
console.log("CONTACT_TO:", env.CONTACT_TO || "(not set, will use SMTP_USER)");
console.log("MONGODB_URI:", env.MONGODB_URI ? "set" : "(missing)");

if (env.RESEND_API_KEY) {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY.trim()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: "Portfolio Contact <onboarding@resend.dev>", to: [env.CONTACT_TO], subject: "Portfolio test email", text: "It works." }),
  });
  console.log(r.ok ? "\nEMAIL (Resend): test message sent - check your inbox (and spam)" : `\nEMAIL FAILED (Resend): ${r.status} ${await r.text()}`);
  process.exit(0);
}

const port = Number(env.SMTP_PORT || 465);
const t = nodemailer.createTransport({
  host: (env.SMTP_HOST || "smtp.gmail.com").trim(), port, secure: port === 465,
  connectionTimeout: 10000,
  auth: { user: (env.SMTP_USER || "").trim(), pass: (env.SMTP_PASS || "").replace(/\s+/g, "") },
});
try {
  await t.verify();
  console.log("\nEMAIL: login OK");
  await t.sendMail({ from: env.SMTP_USER, to: env.CONTACT_TO || env.SMTP_USER, subject: "Portfolio test email", text: "It works." });
  console.log("EMAIL: test message sent - check your inbox (and spam)");
} catch (e) { console.log("\nEMAIL FAILED:", e.message); }

if (env.MONGODB_URI) {
  try {
    const c = await new MongoClient(env.MONGODB_URI.trim(), { serverSelectionTimeoutMS: 6000 }).connect();
    await c.db(env.MONGODB_DB || "portfolio").command({ ping: 1 });
    console.log("DATABASE: connected OK"); await c.close();
  } catch (e) { console.log("DATABASE FAILED:", e.message); }
}
