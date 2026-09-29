# Ayesha Tariq - Portfolio (Next.js)

Frontend + backend in one project. Contact form -> saved in MongoDB + emailed to you.

## 1. Edit your details
Open `components/Portfolio.jsx`, edit the top part only:
`PROFILE` (name, email, phone, links), `PLUGINS`, `TESTIMONIALS`.
Your websites live in `lib/projects.js`.

## 2. Setup services (free)
**MongoDB Atlas:** create free cluster > Database Access (create user) > Network Access (allow 0.0.0.0/0)
> Connect > Drivers > copy the connection string into `MONGODB_URI`.

**Gmail:** turn on 2-Step Verification > Google Account > Security > App passwords > create one
> put the 16-character password in `SMTP_PASS`. Put your Gmail in `SMTP_USER` and `CONTACT_TO`.

## 3. Run
```
npm install
cp .env.example .env.local     # then fill in the values
npm run test:mail              # checks email + database settings (Node 20.6+)
npm run dev                    # http://localhost:3000
```
**Restart `npm run dev` every time you change `.env.local`.**

## 4. Deploy (Vercel)
Push to GitHub > import in vercel.com > add the same variables from `.env.local`
under Settings > Environment Variables > Deploy.

## How the contact flow works
1. Visitor sends the form -> `POST /api/contact`
2. Server validates (name, email, message), blocks bots (hidden field + 5 messages / 10 min per IP)
3. Message is saved in MongoDB (`portfolio.messages`) first, so it is never lost
4. Email arrives in your inbox (press Reply to answer the visitor directly)
5. Visitor gets an automatic "thanks" email (set `AUTO_REPLY=false` to turn off)

## Website previews (Desktop / Tablet / Mobile)
Each site is shown live in a device frame. If a site forbids embedding, or is slow, the preview
switches automatically to a screenshot, so it is never blank.

For guaranteed screenshots that never depend on a third-party service, run once on your computer:
```
npm i -D playwright
npx playwright install chromium
npm run shots
```
This saves real desktop, tablet and mobile screenshots in `public/shots/` and lists them in
`lib/shots.json`. Commit both. Re-run it whenever a site changes.

## Contact form not sending email?
`npm run test:mail` tells you exactly what is wrong. Email needs `SMTP_PASS` = a Gmail **App password**
(not your normal Gmail password). On Vercel, add every variable from `.env.local` in
Settings > Environment Variables, then redeploy.
