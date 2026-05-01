# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a fork of [Quizify (格致)](https://github.com/e-chehil/anki-quizify) — an Anki flashcard template system with interactive markup (fill-in-blank, multiple choice, expand/collapse, popup annotations). This fork adds **Nested Reveal**: a progressive example-sentence reveal mode for vocabulary learning, with auto-rating (Again/Hard/Good/Easy).

## Build & Export

```bash
npm install              # install esbuild (one-time)
node build.js            # bundle src/*.js → Card Template/_quizify.js
pip install genanki
python export.py         # exports apkg with test card to Deck/
python export.py --no-card    # note type only, no sample card
```

## Architecture

### Source split (esbuild)

JS is authored in `src/` as 5 modules, then bundled by esbuild into the single `_quizify.js` that Anki loads:

```
src/
├── platform.js    # __showAnswer, __rateCard, __quizifyLog, debug toggle
├── parse.js       # parseAudio, parseExamples
├── front.js       # state, DOM rendering, button handlers, init, module publish
├── back.js        # back-side bridge + example list rendering
└── index.js       # entry point: imports all modules + auto-init
```

`node build.js` runs esbuild with `--bundle --format=iife --target=es5`, producing a single IIFE-wrapped `_quizify.js` (~290 lines). No tree-shaking needed — all modules are side-effect imports.

### External JS (Critical)

`Card Template/_quizify.js` is loaded via `<script src="_quizify.js">`. The templates (`front1.html`, `back1.html`) contain only original Quizify HTML/CSS/inline scripts plus this one script tag. `_quizify.js` is bundled into the `.apkg` as a media file via `genanki.Package(deck, media_files=[...])`.

**Why external JS is mandatory**: Anki's Qt WebEngine HTML parser silently discards `<script>` blocks that contain HTML closing tags in JS strings (`'</div>'`, `'</span>'`, `'</audio>'`) or exceed ~20-30 lines. External `.js` files completely bypass this bug.

### Card Actions (Platform Abstraction)

Card templates use two wrapper functions defined in `_quizify.js`:

```javascript
window.__showAnswer()     // Desktop: pycmd('ans') | AnkiDroid: showAnswer()
window.__rateCard(ease)   // Desktop: pycmd('easeN') | AnkiDroid: no-op (manual rating)
```

AnkiDroid's new Reviewer does NOT support `pycmd()` at all, and its `buttonAnswerEaseN()` functions route to `signal:` URLs which show an "unsupported" warning dialog. AnkiDroid only supports `ankidroid://show-answer` for flipping cards. Auto-rating is disabled on AnkiDroid — users rate manually via native buttons.

### Fields

| Field | Note |
|-------|------|
| `Word` | Renamed from original `Front` |
| `Back` | Same as original |
| `Media` | Word pronunciation audio (clickable speaker icon) |
| `ExampleList` | Example sentences, `\|\|` separated, optional `::audio.mp3` per example |
| `Notes` | User notes, shown above Back on the answer side |
| `Skip Replace` | Same as original (controls markup parsing) |

`{{Deck}}` and `{{Tags}}` are auto-injected by Anki — no custom fields needed.

### State Machine (Front Side)

State stored in `window.__nestedState` (not IIFE closure, to survive across multiple `<script>` tags if needed):

```
initial → 认识 → revealing (show next example)
       → 不认识 → flip to back (user manually rates)
       → 简单 → easy_confirm (show all examples, confirm → Easy/4)

revealing → 认识 (last) → Good/3 auto-rate
         → 认识 (not last) → show next
         → 不认识 → flip to back (reveal state saved)
```

### Back Side

`_quizify.js` contains a back-side section that:
1. Reads `window.__quizifyRevealState` (set by front-side `handleUnknown`)
2. Renders examples with known/unrevealed indicators (✓/✗)
3. Shows summary "认识了 X/Y 个例句"
4. Auto-rating bridge reads `window.__quizifyEase` (Desktop only)

## Debugging

Click the ⚙ gear button at bottom-right of card → toggle **Debug Mode**. A green status bar appears at card top showing `[TAG] message` entries from `window.__quizifyLog()`. Default is OFF, state persists across cards within a session.

**Anki caches media files** — when re-importing after updating `_quizify.js`, delete the old file from `collection.media/` first.

## Browser Testing

`test.html` is a standalone test harness that simulates Anki's card rendering in a browser. It has its own copy of the nested reveal logic (not the external JS). Used for rapid iteration before Anki testing.

Start with: `python -m http.server 8765` → open `http://localhost:8765/test.html`

## Anki-Specific Pitfalls Discovered

1. **No HTML closing tags in JS strings** — causes script block silent discard. Use DOM APIs (`createElement`, `createDocumentFragment`) or `<\/` escaping.
2. **No `showAnswer()` / `buttonAnswerEase1-4()` in card scope** — `typeof showAnswer` is `undefined` in card JS. Use `pycmd('ans')` / `pycmd('ease1-4')`.
3. **`window.` prefix required in onclick** — `onclick="QuizifyNestedReveal.handle()"` resolves to undefined. Use `onclick="window.QuizifyNestedReveal.handle();return false;"`.
4. **`return false` in all onclick** — Anki sets `<base>` tag; without it, clicks trigger page navigation.
5. **`[sound:file.mp3]` in fields becomes `[anki:play:q:N]`** during rendering — filename not accessible from JS. Use raw filenames for custom audio.
6. **Anki genanki media_files** — must pass to `Package()` constructor, not set as attribute after.
