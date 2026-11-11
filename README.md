# KULU website

The KULU site: a plain static site with no framework and no build step. `reference/full-site-preview.html` is the approved design this site was built from. It stays in the repo for reference but isn't deployed (see `.vercelignore`).

```
index.html             homepage: the customer site (book in the app, washes, find us)
ownerkulu/index.html   kulugroup.co.za/ownerkulu: the partner site ("Own a KULU")
app/index.html         kulugroup.co.za/app: the QR code target, sends phones to the right app store
404.html               "Lost? Shap shap, back home."
css/app-landing.css    styles for the homepage and /app
css/styles.css         styles for /ownerkulu (from the approved design)
css/owner.css          /ownerkulu restyle: lime accent and Archivo headings
js/main.js             settings (contact details, Formspree, app store links, hours) and all page behaviour
assets/logos/          KULU logos as SVG (black and white versions)
assets/images/         illustration, layout plans, QR code, social share image
favicon.svg, favicon-32.png, apple-touch-icon.png
robots.txt, sitemap.xml, vercel.json (also redirects the old /new preview to the homepage)
```

To preview it locally, run a static server in this folder and open http://localhost:8080:

```bash
python3 -m http.server 8080
```

## Change the contact details or the Formspree form

Both are at the top of `js/main.js`:

```js
const FORMSPREE_ID = "xkjjvzyz";

const CONFIG = {
  EMAIL: "info@kulugroup.co.za",
  WHATSAPP: "+27 63 281 7102",
  PARTNER_EMAIL: "taylor@kulugroup.co.za",
  APP_STORE_URL: "",
  PLAY_STORE_URL: "",
  OPENS: "08:00",
  CLOSES: "18:00"
};
```

- **APP_STORE_URL / PLAY_STORE_URL**: paste the store links when the app is live. The App Store and Google Play buttons, and the QR code (which points to `kulugroup.co.za/app`), start sending people to the stores straight away. While they're empty, the buttons say "Coming soon".
- **OPENS / CLOSES**: drive the "Open now" badge on the homepage (South African time, every day).

- **FORMSPREE_ID** is the last part of your form's endpoint. If Formspree shows `https://formspree.io/f/abcdwxyz`, the ID is `abcdwxyz`.
- **CONFIG** fills in the "Say hello" section. The WhatsApp link (`https://wa.me/27632817102`) is built from the number automatically, and the emails become `mailto:` links.
- `index.html` contains the same details as fallback text for search engines. JavaScript overwrites it with CONFIG, so you only need to edit `js/main.js`. If you change a detail, it's worth updating the fallback too.

Each form submission sends: `enquiry_type` ("Tell me when you open" or "I'm an estate or centre"), `name`, `email`, `site` (partners only), `phone`, `message`, and the subject line "KULU website: <enquiry type>". The hidden `_gotcha` field is Formspree's spam honeypot.

**Formspree setup:** in your Formspree form's settings, add `kulugroup.co.za` (and your `*.vercel.app` preview domain if you want to test there) under allowed domains. Then send one real test from the live site and confirm it lands in the inbox.

## Push to GitHub

1. Create an empty repository on GitHub, for example `kulu-website`. Don't add a README or .gitignore.
2. In this folder:

```bash
git init -b main
```

```bash
git add .
```

```bash
git commit -m "KULU website"
```

```bash
git remote add origin https://github.com/YOUR-ACCOUNT/kulu-website.git
```

```bash
git push -u origin main
```

(If this folder is already a git repository, skip `git init`.)

## Deploy on Vercel

1. Sign in at vercel.com with GitHub, then click **Add New… → Project**.
2. Import the `kulu-website` repository.
3. Use these settings:
   - Framework Preset: **Other**
   - Root Directory: `./`
   - Build Command: leave empty (override it to empty if Vercel fills one in)
   - Output Directory: leave empty, or `.`
4. Click **Deploy**. You'll get a `*.vercel.app` URL within a minute.

From then on, every push to `main` redeploys the site automatically. Pushes to other branches get their own preview URLs.

`vercel.json` adds a 7-day cache for `/assets/*` and a couple of security headers. Vercel serves `404.html` for any missing page automatically.

## Connect kulugroup.co.za

1. In Vercel, open the project and go to **Settings → Domains**.
2. Add `kulugroup.co.za`, then add `www.kulugroup.co.za`. When Vercel asks, choose to redirect `www` to `kulugroup.co.za` (the canonical URL in the site is `https://kulugroup.co.za/`).
3. At your domain registrar or DNS host (for example Domains.co.za, Afrihost, Xneelo or Cloudflare), add these records:

| Type  | Name / Host | Value                  | TTL     |
|-------|-------------|------------------------|---------|
| A     | `@`         | `76.76.21.21`          | 3600    |
| CNAME | `www`       | `cname.vercel-dns.com` | 3600    |

   - Delete any existing `A` or `AAAA` records on `@` and any existing `www` record first. Old records pointing at a parking page will conflict.
   - Leave your **MX** and email-related **TXT** records (SPF, DKIM, DMARC) alone, so `info@` and `taylor@` keep working.
   - Vercel's Domains screen shows the exact values it wants for your project. If they differ from the table, use Vercel's values. Newer projects are sometimes given a project-specific CNAME or IP.
   - If you use Cloudflare, set these records to **DNS only** (grey cloud) so Vercel can issue the SSL certificate.
4. Wait for the domains to show **Valid Configuration** in Vercel. That usually takes minutes, and occasionally a few hours. HTTPS is set up automatically.

**If you use a different domain:** search the project for `kulugroup.co.za` and replace it in `index.html` (canonical link and the `og:`/`twitter:` tags), `robots.txt` and `sitemap.xml`.

## After launch

- Check the social preview by pasting the URL into https://www.opengraph.xyz or a WhatsApp chat.
- Submit `https://kulugroup.co.za/sitemap.xml` in Google Search Console.
