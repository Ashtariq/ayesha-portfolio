// Your live websites. Add / remove / rename here.
// Screenshots are optional: run `npm run shots` once and they are generated for you
// (see README). The site itself is shown live whenever the site allows it.

const slugOf = (url) =>
  new URL(url).hostname.replace(/^www\./, "").replace(/[^a-z0-9]+/gi, "-").toLowerCase();

const site = (url, title) => ({
  title,
  url,
  slug: slugOf(url),
  category: "Client Websites",
  description: "Live client website. Preview it on desktop, tablet and mobile below.",
  tags: [],
});

export const PROJECTS = [
  site("https://alphacorp.ai/", "Alpha Corp AI"),
  site("https://properroyals.com/", "Proper Royals"),
  site("https://gadgetinnovative.com/", "Gadget Innovtive"),
  site("https://smileshade.ca/", "Smile Shade"),
  site("https://starsmilesnursery.ae/", "Star Smiles Nursery"),
  site("https://hydrosystem.com/", "Hydro System"),
  site("https://www.wiscopm.com/", "Wisco PM"),
  site("https://bubblepawz.com.au/", "Bubble Pawz"),
  site("https://shaquemgriffin.com/", "Shaquem Griffin"),
  site("https://www.vicegerent.com/", "Vicegerent"),
  site("https://upright-productions.com/", "Upright Productions"),
  site("https://adaptivetalentsolutions.com/", "Adaptive Talent Solutions"),
  site("https://westutter.org/", "Westutter"),
  site("https://mouseglass.com/", "Mouse Glass"),
  site("https://chenplumbing.com/", "Chen Plumbing"),
  site("https://medicad.com.au/", "Medicad"),
  site("https://insuranceforprofessionalservices.com/", "Insurance for Professional Services"),
  site("https://premierwallservicing.co.uk/", "Premier Wall Servicing"),
  site("https://groomguy.com/", "Groom Guy"),
];
