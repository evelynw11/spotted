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

