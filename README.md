# PhiAcademy — Mathematics Social Media Generator

Premium, handwritten-notebook-style math cards for social media — generated
automatically from a Google Sheet, an RSS feed, or any data source, via
**GitHub Pages + n8n + ScreenshotOne**.

![theme previews](https://img.shields.io/badge/themes-navy%20%7C%20emerald%20%7C%20plum-7A3B69) ![output](https://img.shields.io/badge/output-1080%C3%971350px%20PNG-1B3A6B) ![license](https://img.shields.io/badge/license-MIT-514C46)

---

## What this is

A static site with two faces:

1. **A homepage showcase card** (`index.html`) — a clean, non-interactive
   display of the notebook-style card on white paper with blue ruled lines:
   a red margin rule, binder holes, a dashed "GIVEN" box, a yellow
   highlighter marker over the key result, and a hand-wobbled red-pen circle
   around the final answer, complete with a teacher's ✓ stamp. It renders
   whatever data is in the URL query string (see the parameter table below),
   falling back to a sample problem when there isn't one.
2. **An automation endpoint** (`templates/mathematics-card.html`) — the same
   card, driven entirely by URL query parameters, with no chrome at all.
   Point ScreenshotOne at it and you get a clean 1080×1350 PNG, ready to post.

Neither page has any editing UI — both are pure display/render targets.
To change the content shown, edit the query string or the `DEFAULT_DATA`
object at the top of `script.js`. No build step, no framework, no
server-side code. Everything is plain HTML/CSS/JS so it can be hosted for
free on GitHub Pages.

---

## Folder structure

```
PhiAcademy/
├── index.html                    interactive editor + live preview
├── style.css                     design system + card component styles
├── script.js                     rendering engine (form + URL param modes)
├── README.md
├── LICENSE
│
├── assets/
│   ├── images/placeholder.jpg    sample notebook-paper texture
│   ├── logos/phiacademy-logo.png brand mark used on every card
│   └── fonts/                    reserved for self-hosted fonts (empty by
│                                 default — see "Fonts" below)
│
├── templates/
│   ├── mathematics-card.html     ⭐ the automation endpoint — no chrome
│   └── sample-data.json          example data shape for your workflow
│
└── examples/
    └── example-output.html       a static, hard-coded finished card
```

---

## Quick start (local preview)

You only need a static file server — opening `index.html` directly with
`file://` will work for layout, but some browsers restrict fonts/clipboard
on `file://`, so a local server is recommended:

```bash
cd PhiAcademy
python3 -m http.server 8000
# open http://localhost:8000/index.html
```

Open `http://localhost:8000/index.html` on its own to see the sample card,
or append query parameters to preview real content, e.g.:
```
http://localhost:8000/index.html?title=Completing+the+Square&theme=emerald
```
See the full parameter table below for everything you can control this way.

---

## Deploying to GitHub Pages

1. Push this folder to a GitHub repository (root of the repo, or a
   `/docs` folder — either works).
2. In the repo, go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to "Deploy from a branch",
   pick your branch (e.g. `main`) and the folder (`/` or `/docs`).
4. Save. GitHub will publish your site at:
   ```
   https://<your-username>.github.io/<repo-name>/
   ```
5. Your automation endpoint is now publicly reachable at:
   ```
   https://<your-username>.github.io/<repo-name>/templates/mathematics-card.html
   ```

That URL is what you'll give to ScreenshotOne in the workflow below.

---

## The URL parameter API

The rendering engine (`script.js`) reads these query parameters. Any
parameter you omit falls back to a sample default, which is useful while
testing.

| Parameter  | Required | Description | Example |
|---|---|---|---|
| `embed`    | for automation | `1` hides all editor chrome and renders the card at its true 1080×1350px size — always set this for ScreenshotOne | `embed=1` |
| `topic`    | recommended | Short tag shown top-right of the card | `Calculus%20%C2%B7%20Limits` |
| `title`    | recommended | The big handwritten headline | `The%20Squeeze%20Theorem` |
| `problem`  | recommended | The problem statement, shown in the dashed "GIVEN" box | `Evaluate%20lim(x%E2%86%920)...` |
| `steps`    | recommended | Solution steps, joined with the pipe character `\|` | `Step%20one\|Step%20two\|Step%20three` |
| `formula`  | recommended | The key result line. Wrap the important part in `**double asterisks**` to render it under the highlighter marker | `So%20**lim%20%3D%200**` |
| `answer`   | recommended | The final answer, circled in red pen | `L%20%3D%200` |
| `hashtags` | optional | Space-separated hashtags for the footer | `%23calculus%20%23mathhelp` |
| `handle`   | optional | Social handle in the footer (defaults to `@phiacademy`) | `%40phiacademy` |
| `cardno`   | optional | Small "page number" label, bottom-right | `014` |
| `theme`    | optional | `navy` \| `emerald` \| `plum` | `navy` |

**Tip:** the "Get share link" button inside `index.html` builds this exact
URL for you from whatever is currently in the editor — use it to sanity
check a card before wiring it into automation.

A full worked example:

```
https://<user>.github.io/<repo>/templates/mathematics-card.html?embed=1&topic=Algebra+II&title=Completing+the+Square&problem=Solve+x%C2%B2%2B6x%2B5%3D0&steps=Move+the+constant|Add+9+to+both+sides|Factor|Take+the+square+root&formula=So+**x+%3D+-1+or+-5**&answer=x+%3D+-1%2C+-5&hashtags=%23algebra+%23mathhelp&handle=%40phiacademy&cardno=022&theme=emerald
```

See `templates/sample-data.json` for three ready-made examples in a
JSON shape you can copy directly into a Google Sheet, Airtable, or n8n
Set node.

---

## Automating with n8n + ScreenshotOne

The workflow below turns a row of data (from a Google Sheet, Airtable,
RSS feed, or manual trigger) into a published PNG, fully hands-off.

### 1. Get a ScreenshotOne API key

Sign up at [screenshotone.com](https://screenshotone.com) and copy your
**Access Key** from the dashboard.

### 2. Build the n8n workflow

**Node 1 — Trigger.** Anything that produces one item per card: a
Schedule Trigger, a Google Sheets "On row added" trigger, an RSS Feed Read,
or a manual Webhook.

**Node 2 — Set / Edit Fields.** Map your source data onto the field names
from the URL parameter table above: `topic`, `title`, `problem`, `steps`,
`formula`, `answer`, `hashtags`, `handle`, `cardno`, `theme`. If your source
stores solution steps as separate rows/columns, join them here with a
Function node:
```js
return { json: { ...items[0].json, steps: items[0].json.stepList.join('|') } };
```

**Node 3 — Function (build the card URL).** Construct the query string and
URL-encode every value:
```js
const base = "https://<user>.github.io/<repo>/templates/mathematics-card.html";
const d = items[0].json;
const params = new URLSearchParams({
  embed: "1",
  topic: d.topic,
  title: d.title,
  problem: d.problem,
  steps: d.steps,
  formula: d.formula,
  answer: d.answer,
  hashtags: d.hashtags,
  handle: d.handle || "@phiacademy",
  cardno: d.cardno,
  theme: d.theme || "navy"
});
return { json: { cardUrl: `${base}?${params.toString()}` } };
```

**Node 4 — HTTP Request (call ScreenshotOne).** `GET` request to:
```
https://api.screenshotone.com/take
```
with query parameters:

| Key | Value |
|---|---|
| `access_key` | your ScreenshotOne access key |
| `url` | `{{$json.cardUrl}}` |
| `viewport_width` | `1080` |
| `viewport_height` | `1350` |
| `device_scale_factor` | `2` (sharper output for retina posting) |
| `selector` | `#phi-card` |
| `format` | `png` |
| `block_ads` | `true` |
| `delay` | `1` (lets Google Fonts finish loading before the shot) |
| `cache` | `false` |

Set the node's **Response Format** to "File" so n8n receives binary PNG data.

**Node 5 — wherever the image goes next.** Upload the binary output to
Buffer, Later, Google Drive, an Instagram Graph API "publish" node, or
just save it to disk — your workflow, your call.

### 3. Test one card before scheduling many

Before wiring this into a schedule, run the workflow manually with a single
test item and confirm the PNG looks right. Common things to check:
- Long problem/step text doesn't overflow — keep to the character limits
  used in the editor's `maxlength` attributes as a guide.
- `theme` is spelled exactly `navy`, `emerald`, or `plum`.
- Every value passed to `URLSearchParams` is a string (numbers will still
  work, but booleans/objects won't).

---

## Customizing the design

All design tokens live at the top of `style.css` inside `:root`:

```css
--paper, --ink, --graphite, --rule-blue, --margin-red,
--red-pen, --highlighter, --gold-tape
```

To add a fourth theme, add a block like:

```css
.theme-sunset { --accent: #B65C2E; --highlight: #FFD9A8; }
```

and add a matching button in the `.theme-swatches` section of `index.html`
(`data-theme="sunset"`).

### Fonts

The card uses three Google Fonts, loaded via CDN `<link>` tags in the
`<head>` of `index.html`, `templates/mathematics-card.html`, and
`examples/example-output.html`:

- **Kalam** — headline / display handwriting
- **Patrick Hand** — body handwriting (steps, problem text)
- **JetBrains Mono** — utility/metadata text (tags, footer, hashtags)

If you'd rather not depend on Google's CDN (useful for stricter privacy
requirements, or fully offline builds), download the `.woff2` files for
each font into `assets/fonts/`, add `@font-face` rules to the top of
`style.css`, and remove the Google Fonts `<link>` tags.

---

## Browser support

Built with standard CSS (Grid, custom properties, `mix-blend-mode`) and
vanilla JS — no transpilation needed. Tested against current Chrome,
Firefox, Safari, and Edge. `prefers-reduced-motion` is respected (there is
no motion beyond a hover transition, by design — a card built to be
screenshotted has no reason to animate).

---

## License

MIT — see `LICENSE`. The generated cards (your problems, solutions, and
copy) are yours; the code and design system are free to reuse and modify.
