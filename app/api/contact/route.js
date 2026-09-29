import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { sendMails } from "@/lib/mailer";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const clean = (v, max) => String(v ?? "").trim().slice(0, max);

// Simple spam guard: 5 messages per 10 minutes per IP (per server instance)
const hits = new Map();

function limited(ip) {
  const now = Date.now();

  const recent = (hits.get(ip) || []).filter(
    (t) => now - t < 10 * 60 * 1000
  );

  const blocked = recent.length >= 5;

  if (!blocked) recent.push(now);

  hits.set(ip, recent);

  return blocked;
}

export async function POST(req) {
  let body;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 }
    );
  }

  if (body.website) {
    return NextResponse.json({ ok: true });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  if (limited(ip)) {
    return NextResponse.json(
      { error: "Too many messages. Please try again later." },
      { status: 429 }
    );
  }

  const name = clean(body.name, 100);
  const email = clean(body.email, 150).toLowerCase();
  const phone = clean(body.phone, 30);
  const message = clean(body.message, 3000);

  if (name.length < 2) {
    return NextResponse.json(
      { error: "Please enter your name." },
      { status: 400 }
    );
  }

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email." },
      { status: 400 }
    );
  }

  if (message.length < 10) {
    return NextResponse.json(
      { error: "Message is too short (min 10 characters)." },
      { status: 400 }
    );
  }

  const doc = {
    name,
    email,
    phone,
    message,
    ip,
    userAgent: clean(req.headers.get("user-agent"), 300),
    emailSent: false,
    createdAt: new Date(),
  };

  // 1) Save to MongoDB
  let db = null;
  let id = null;
  const problems = [];

  try {
    db = await getDb();

    id = (
      await db.collection("messages").insertOne(doc)
    ).insertedId;
  } catch (e) {
    console.error("DB error:", e.message);
    problems.push("Database: " + e.message);
  }

  // 2) Send email (to CONTACT_TO, or SMTP_USER when CONTACT_TO is empty)
  const smtpConfigured = Boolean(process.env.RESEND_API_KEY || (process.env.SMTP_USER && process.env.SMTP_PASS));
  let emailed = false;

  if (smtpConfigured) {
    try {
      await sendMails(doc);
      emailed = true;

      if (db && id) {
        await db.collection("messages").updateOne(
          { _id: id },
          { $set: { emailSent: true } }
        );
      }
    } catch (e) {
      console.error("Email error:", e.message);
      problems.push("Email: " + e.message);
    }
  } else {
    problems.push("Email: SMTP_USER / SMTP_PASS are not set");
  }

  // The visitor sees success if the message reached you in ANY way (database or email).
  // Only when both failed do we show an error, so nothing is silently lost.
  if (!id && !emailed) {
    console.error("Contact form failed:", problems.join(" | "));
    return NextResponse.json(
      {
        error: "Sorry, your message could not be sent. Please email me directly or use WhatsApp.",
        ...(process.env.NODE_ENV !== "production" && { detail: problems.join(" | ") }),
      },
      { status: 500 }
    );
  }

  if (problems.length) console.error("Contact form partial problem:", problems.join(" | "));

  return NextResponse.json({ ok: true });
}
