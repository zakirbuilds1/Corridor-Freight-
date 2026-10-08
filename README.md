# Corridor Freight Co. — logistics website

Static, framework-free site: 4 pages plus the standalone hero. Open `index.html` in a browser, or deploy the folder as-is.

## Structure

Every page is built like the hero: dark, two condensed fonts, and everything lined up on one vertical center line (the train) with blocks mirrored left and right of it.

```
index.html      Home: the exact freight-train video hero, six services mirrored on the track, numbers band,
                coordinator split screen, live tracking demo, four-step track, industries, reviews, FAQ, quote band
about.html      Photo hero in the same layout, story, night desk, four rules, timeline, network map, leadership
services.html   Photo hero, six services split on the center line, comparison table, rate estimator, platform, FAQ
contact.html    Photo hero, quote form (validation + success screen), real-people split, offices, FAQ
hero.html       The exact standalone hero from the spec (one file, fonts embedded). Optional, works on its own at /hero
css/style.css   All styles. Colors, fonts and spacing are at the top
css/fonts/      Anton and Oswald (woff2, self-hosted)
js/main.js      Menu, scroll reveals, count-up numbers, tracking demo, rate estimator, quote form, newsletter
images/         WebP photos in 2 sizes each (+ blurred placeholders inlined in the HTML)
vercel.json     Clean URLs (/about, /services ...) and cache headers
```

The header, menu, footer and "Tell us what you're moving" band are repeated in every page. If you change one of them, change it in all four pages.

## Where to edit things

- **Prices** ("From $1.45/mi" etc.): `PRICES` at the top of `js/main.js`. Every price label on the site is filled from that list.
- **Rate estimator math**: `RATES`, `EXTRAS` and `EXPEDITE` in `js/main.js` (amounts in cents).
- **Tracking demo**: `SHIPMENTS` in `js/main.js`. Demo numbers are CRD-48213, CRD-77105 and CRD-30562. Dates are generated relative to today so the demo always looks current.
- **Colors / fonts**: the `:root` block at the top of `css/style.css`. The accent is `--accent: #D6523A`.
- **Hero video**: the `<video>` and the `<link rel="preload">` in `index.html` (and `hero.html`) point to the CloudFront URL. If that URL is removed, the hero still shows on a black background.

## Placeholders to replace before launch

- Phone numbers use the fictional 555-01xx range: (800) 555-0142, (816) 555-0137, (312) 555-0164, (214) 555-0119, (562) 555-0183
- Emails and domain: quotes@ / hello@corridorfreight.com
- Office addresses (Kansas City, Chicago, Dallas, Long Beach)
- USDOT 0000000 / MC 000000 in the footer
- Stats (98.7% on-time, 41,600 loads, 12-min reply, 2,400+ carriers), testimonials, team names and photos, timeline years
- Open Graph image: none is set yet. Add `<meta property="og:image">` once a share image exists

## Forms (need a backend before launch)

The quote form, the "Continue to quote" mini form and the newsletter all validate and show a success state, but **nothing is sent anywhere yet**.

- Quote form: the `[data-quote-form]` submit handler in `js/main.js`. Add a `fetch()` to Formspree, Basin, Web3Forms, HubSpot or a Vercel function where the success screen is shown.
- Newsletter: the `[data-newsletter]` handler. Connect it to Mailchimp, ConvertKit, etc.
- The mini form already passes `from`, `to` and `mode` to `contact.html`, and the estimator passes its result into the Notes field.

## Performance

- Photos are WebP in 2 widths with `srcset`/`sizes` and lazy loading. The page heroes use `fetchpriority="high"`
- Each photo shows a tiny blurred placeholder (inlined) and fades in when loaded
- Fonts are preloaded. `vercel.json` caches images for 30 days and fonts for 1 year
- Animations respect "reduce motion" settings

## Deploy (GitHub + Vercel)

1. GitHub → **New repository** → create it → **uploading an existing file**.
2. Open this folder, press **Ctrl+A**, drag everything into the upload box (including the `css`, `js` and `images` folders). Wait for all files to finish uploading → **Commit changes**.
3. vercel.com/new → **Import** the repository → Framework Preset **Other** → leave the build command empty → **Deploy**.
