# Spotted

**An AI clothing finder for outfits you see in real life.** Upload a photo of an outfit you liked, and Spotted finds where to buy the exact piece, or close alternatives that fit your budget and values. Every result shows *why* it was picked and *what you should double-check* before buying.

**[Try the live demo](https://evelynw11.github.io/spotted/)** · [Download the single-file version](spotted-demo.html) (open it in Chrome, no install needed)

> **This is a clickable prototype.** All AI output is scripted demo data. Store names, prices and listings are made up, and the photos are AI-generated. Nothing is bought or sent anywhere.

![Spotted workspace: the photo with detected pieces, the likely exact match, and the assistant](docs/screenshots/03-same-item.jpg)

---

## The problem

You see a cute outfit on the way to class. You want it, but asking a stranger where it's from feels awkward. So you screenshot it and spend half an hour on Pinterest or reverse image search, and usually come up empty.

Reverse image search can find visually similar items, but it can't take into account what *you* care about, such as a budget, buying secondhand, or avoiding fast fashion. It also doesn't tell you how confident it is or why a result matched.

## Who it's for

People (especially students) who want to buy clothing they've seen in person or online, but don't know what it is or where to find it.

## What it does

1. **Reads your photo.** Detects each clothing piece (cardigan, skirt, bag, shoes), with a confidence level for each. Faces and bystanders are blurred first.
2. **Finds the same item when it can.** Shows a "likely the same item" match, which visible details match, and what it couldn't check (fabric, true color, fit).
3. **Finds close alternatives when it can't.** Similar items from new, secondhand and sustainable sellers, each with a "Why this match?" breakdown and a "Before you buy" note.
4. **Adapts to you.** Tell the assistant "under $50" or "secondhand please" (or use the preference panel). Results re-rank, and a banner shows what moved and why. Every change can be undone.
5. **Learns from feedback, but asks first.** A thumbs-down asks what's off. Instead of silently changing your preferences, the assistant asks, e.g. "Should I cap your budget at $50?". Anything it infers is labeled *inferred* until you keep or remove it.
6. **Admits when it doesn't know.** For small or generic items (the loafers, a plain tote), it won't guess an exact match. It explains why and suggests what to do instead.
7. **Suggests outfits.** AI styling ideas built around the found piece, plus what it would cost to recreate the whole look with your preferences.

## Try it: 2-minute walkthrough

1. Open the [live demo](https://evelynw11.github.io/spotted/) and click **Use this photo**.
2. Watch it blur faces, detect 4 pieces, and search.
3. **Same item** tab: the likely exact cardigan, with 5 of 5 visible details matching. Click **Compare side by side**.
4. In the chat, click **Under $50, please**, then **Secondhand first**. Notice the re-rank banner and how the assistant explains the tradeoffs.
5. **Similar** tab: thumbs-down the TrendMart cardigan and choose **Not sustainable enough**. The assistant asks before hiding fast fashion.
6. In **What I see** (left), fix the color to *Oatmeal / beige*. The exact match drops out, and the assistant explains why. Click **Undo**.
7. Click **Loafers**: low confidence, so it refuses to guess and tells you what would help.
8. **Outfit ideas** tab: three ways to wear the cardigan, plus the cost of the whole look.
9. Turn on **Design notes** (top right) to see which HCI concept each feature demonstrates.

## Screenshots

| | |
|---|---|
| ![Home](docs/screenshots/01-home.jpg) **Home:** upload a photo or try the demo | ![Analyzing](docs/screenshots/02-analyzing.jpg) **Analyzing:** blur faces, detect pieces with confidence |
| ![Compare](docs/screenshots/04-compare.jpg) **Compare:** your photo vs. the listing, detail by detail | ![Re-rank](docs/screenshots/05-rerank-similar.jpg) **Re-rank:** results adapt to "under $50, secondhand" |
| ![Feedback](docs/screenshots/06-feedback-ask.jpg) **Feedback:** the assistant asks before learning a rule | ![No exact match](docs/screenshots/07-no-exact-match.jpg) **Honest uncertainty:** no guessing on low-confidence items |
| ![Outfit ideas](docs/screenshots/08-outfit-ideas.jpg) **Outfit ideas:** styling suggestions and whole-look cost | ![Design notes](docs/screenshots/09-design-notes.jpg) **Design notes:** presenter mode mapping features to concepts |

## Human-AI interaction concepts

| Concept | How Spotted applies it |
|---|---|
| **Trust calibration and appropriate reliance** | Each detected piece and detail shows a confidence level ("Sure / Fairly sure / Not sure"). Each result has "Before you buy" and "What I couldn't check" notes. For low-confidence items, it refuses to guess an exact match. |
| **Explainability** | Match strength is shown as which visible details match (dots), not one opaque score. Every result has a "Why this match?" breakdown, a side-by-side compare table, and an "Explain" link after each re-rank. |
| **Dynamic alignment** | Preferences are labeled *you set* or *inferred*. Inferred ones need a Keep or Remove. The assistant asks before turning feedback into a rule, explains tradeoffs (e.g. the exact item is over budget), and every change can be undone. |
| **Error recovery** | You can correct what the AI *saw* ("the color is actually beige") separately from what you *want* ("show me other colors"), and lock must-have details. |
| **Privacy** | Faces and bystanders are blurred before analysis. Spotted searches for clothes, never for people. |

## How the prototype works

- **Matching:** Each detected piece has a set of attributes (color, knit, neckline, buttons, length...). Each listing is scored detail by detail (same / close / different), weighted, and labeled *Likely the same item*, *Very close*, *Similar* or *Same vibe*.
- **Ranking:** Visual match counts most. Preferences (budget, secondhand or sustainable, size, fast fashion, "longer") then move items up or down, or hide them. Hidden items can always be shown again.
- **Assistant:** A small keyword parser turns chat messages into preference updates, and scripted responses explain the effect of each change.

## Run it locally

No build step or dependencies needed.

```bash
git clone https://github.com/evelynw11/spotted.git
cd spotted
open index.html          # or double-click spotted-demo.html
```

If you edit the code, rebuild the single-file version with Node:

```bash
node build.js            # writes spotted-demo.html with CSS, JS and images inlined
```

## Project structure

```
index.html          App shell
styles.css          All styles
app.js              Demo data, matching and ranking, assistant, views, events
img/                AI-generated demo photos (street photo, products, outfit flat lays)
build.js            Bundles everything into spotted-demo.html
spotted-demo.html   Self-contained single-file demo
docs/screenshots/   Screenshots used in this README
```

## Roadmap: making it real

The places to swap in real models are marked with `// LIVE:` in `app.js`.

| Prototype piece | Real version |
|---|---|
| `ITEMS` (detected pieces, boxes, attributes, confidence) | Gemini vision, returning JSON with boxes, attributes and a confidence per attribute |
| `PRODUCTS` (shopping matches) | Google Lens via SerpAPI on each cropped piece |
| `OUTFITS` and assistant replies | An LLM (e.g. Gemini free tier) given the attributes and the user's preferences |
| `handleUserText` keyword parser | An LLM call that returns structured preference updates |
| Upload button (currently runs the demo photo) | Real upload, with on-device face blurring before anything is sent |

## Course context

Built as a project prototype for **05-318 Human-AI Interaction** at Carnegie Mellon University (Fall 2026).

