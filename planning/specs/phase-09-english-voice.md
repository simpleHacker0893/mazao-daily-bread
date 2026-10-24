# Phase 9: English voice (local speech-to-text and read-back)
> Release: R5 · Milestone: R5 Sema (sprint 006) · Depends on: phase 8 (model test result, model manager, parser, Review Card), phase 7 (read-aloud speech helper) · Label: ready-for-agent

## Problem Statement
At a busy stall a merchant's hands are full of sukuma, change and a phone. Even Andika Haraka needs typing. Many merchants are faster speaking than typing, and some read slowly. PRD §9.5 describes a voice-to-voice loop: speak, review, confirm, hear the confirmation.

The constraints are strict:
- **Voice is English only** in the MVP (D-032), because Kiswahili speech-to-text is too weak (R-007).
- **Audio never leaves the phone** (D-032, spec §8.6, §11).
- Voice ships **only if a speech model passed the model test** (spec §8.5, WER ≤ 20% on noisy Gikomba recordings). Otherwise voice ships off.
- After saving, a merchant who isn't looking at the screen has no confirmation that the right thing was saved.

## Solution
**Sema / Speak** (stitch-prompts §8.1), shipped only if phase 8's model test passed a speech model (P8-A):
- A 120dp hold-to-talk button (the one round control in the app), a live level meter and timer, and "Listening. Hold the phone close."
- Audio is captured in memory, transcribed locally by the winning model (whisper-base.en or moonshine-base, transformers.js in a Web Worker), then discarded. It is never stored or sent.
- The transcript is shown with "Try again" and "Edit text". "Make draft" sends the text into phase 8's parser, and the result opens Thibitisha / Review Card, so `[ ✅ Confirm & Save Record ]` is still required.
- The speech model is downloaded through the phase 8 model manager with consent, size and Wi-Fi-only rules (D-031).

**Read-back:** after any confirmed record (voice, typed AI or manual, per a preference), `speechSynthesis` in English reads a short confirmation such as "Sale of Kenya shillings 150 saved. Wanjiku now owes Kenya shillings 600." Read-back also reads the Review Card summary on request before confirming.

If no speech model passed, this phase ships only read-back. The mic stays disabled with "Voice coming soon", and the decision is recorded.

## User Stories
1. As a mama mboga with wet hands, I want to hold a button and say "sold two trays of eggs to Otieno, he paid 500, the rest on deni until Friday", so that I record a sale without typing.
2. As a boda rider at a petrol station, I want to say "fuel 300 M-Pesa", so that expenses are recorded between trips.
3. As a repair fundi, I want to say "Tecno screen for Otieno, ready Friday, deposit 500", so that a job card is drafted while I hold the phone.
4. As a kiosk owner, I want to see what the app heard before anything is drafted, so that I can fix a misheard word.
5. As a mama mboga, I want "Try again" and "Type instead" when audio was unclear, so that a noisy moment doesn't trap me.
6. As a kiosk owner, I want every voice draft to go through the Review Card and `[ ✅ Confirm & Save Record ]`, so that a misheard number is never saved by itself (D-028).
7. As a mama mboga, I want to be told my voice stays on the phone and is deleted after reading, so that I feel safe using it.
8. As a kiosk owner, I want voice to work offline once the model is downloaded, so that it works in Gikomba's dead spots.
9. As a mama mboga, I want to agree to the voice download and see its size first, and have it wait for Wi-Fi, so that my data bundle is protected (D-031).
10. As a mama mboga, I want the app to say back what it saved, so that I know it got it right without reading the screen.
11. As a kiosk owner, I want to turn read-back off, so that the phone stays quiet when I need it to.
12. As a mama mboga, I want read-back to include the customer's new deni after a credit sale, so that I can tell the customer their balance on the spot.
13. As a kiosk owner, I want to hear the Review Card summary before confirming, so that I can check while serving.
14. As a boda rider whose phone can't run voice, I want a clear "Voice isn't available on this phone; typing still works" message, so that I'm not left guessing.
15. As a kiosk owner, I want the mic permission asked only when I first use Sema, with a plain reason, so that I trust the request.
16. As a mama mboga, I want the screen to say clearly that voice is English only, so that I don't try Kiswahili and get rubbish.
17. As a Chama treasurer, I want voice-entered records to be marked and confirmed exactly like typed ones, so that the report's integrity statement still holds.
18. As a developer, I want transcription behind one interface with a fake, so that the voice flow is tested in CI without audio models.
19. As a developer, I want the noisy Gikomba recordings to stay a WER regression suite, so that a model change can't make voice worse unnoticed.
20. As a developer, I want audio buffers released immediately after transcription and never written to storage, so that the privacy promise is enforced in code.
21. As a product owner, I want voice to ship off automatically if the model test failed, so that we never ship a voice feature merchants can't trust (D-032).
22. As a product owner, I want the read-back wording in one English i18n file, so that a Kiswahili version can be added later without code changes.

## Implementation Decisions

### Gate
- The phase 8 decision P8-A decides whether a speech model ships. If none passed, the Sema route is hidden, the mic stays disabled with "Voice coming soon", and only read-back is built.
- Device gate: `deviceAiSupport().stt` (phase 8), which needs a passing trial load. Voice also needs a parser: the local LLM, or cloud parsing opted in with a key present (D-033). Only text goes to the cloud, never audio. Without either, Sema is hidden (proposed decision P9-A).

### Modules and interfaces
- **Recorder:** `getUserMedia` mono audio, resampled to 16 kHz in memory, hold-to-talk with a maximum length (ASSUMPTION: 15 s, enough for one record). It exposes a level value for the meter (no looping pulse animation). Buffers are zeroed and released after transcription or cancel.
- **Transcriber** (one seam):

```ts
interface Transcriber {
  transcribe(audio: Float32Array /* 16 kHz mono, never persisted */): Promise<
    { ok: true; text: string; lowConfidence: boolean } | { ok: false; reason: 'unclear' | 'too_short' | 'model_error' }>;
}
```
  Implementations: the transformers.js worker with the winning model, and a fake for tests.
- **Flow:** transcript → editable text → phase 8 parser → Review Card → existing commit path with `source` set to the AI source (P8-B), plus an input-mode marker for voice (P9-B) so pilot measures can count voice use.
- **Read-back:** a domain function `confirmationSpeech(committed, balancesAfter)` builds the English sentence (reusing phase 7's amount phrasing). A small speech module wraps `speechSynthesis`: picks an `en-*` voice, cancels on navigation, and does nothing if no English voice exists. Preference `readBack: 'off' | 'voice_only' | 'all'` in the operating profile (PRD §8.13 "audio confirmation"). ASSUMPTION: default `voice_only`.

### Screens and routes
- Static route, precached: `/sema`. Entry from the Andika Haraka mic button (enabled now) and a Muhtasari quick action when voice is available.
- stitch-prompts §8.1: "English only" chip, the 120dp round mic, meter and "0:04" timer, transcript block, "Make draft", and the note "Your voice stays on this phone and is deleted after reading." States: unclear audio; no voice model leads to the setup prompt in the model manager.
- Accessibility: hold-to-talk also supports tap to start and tap to stop for people who can't hold; it respects reduced motion.
- Design: Operate mode with core tokens, Sukuma Green mic, no waveform glow and no AI sparkle imagery.

### Schema changes vs R0
- None on the server beyond phase 8's `source` values, unless P9-B adds an input-mode field (ASSUMPTION: it goes inside the existing `source` value or a nullable `input_mode` column; the architect decides).
- Local only: speech-model consent and state (phase 8 model manager tables).

## Testing Decisions
- Good tests check what the merchant sees and saves, and that audio never persists. Not audio internals.
- **Primary seam: the Transcriber interface plus the phase 8 parser and Review Card**, with fakes. Fake transcript → Review Card → confirm → the record saved, and read-back invoked with the expected sentence.
- **Domain tests:** `confirmationSpeech` for a cash sale, a credit sale (new balance), a payment, an expense and a job ready.
- **Privacy test:** after a recording, no IndexedDB, Cache Storage or OPFS entry holds audio, and no network request carries audio (Playwright request interception on the built app).
- **WER suite:** the Gikomba recordings from the R0 collection run in the device harness against the shipped model, and the result must stay ≤ 20% (spec §8.5). Not run in CI.
- **Playwright on the built app:** with a fake media stream and the fake transcriber: Sema → transcript → Make draft → Review Card → `[ ✅ Confirm & Save Record ]` → record listed, offline.
- Manual device check: a real noisy-stall test with 2 pilot merchants; time from release of the button to Review Card.

## Out of Scope
- Kiswahili or Sheng speech input and Kiswahili read-back (D-032, phase 11).
- Cloud speech-to-text of any kind (D-032).
- Wake words, continuous listening, voice commands for navigation.
- Storing recordings for training or review (spec §11).

## Further Notes
- **Decisions the architect must record before building:**
  - **P9-A:** voice needs a parser; whether voice with cloud parsing (text only) is allowed for phones under 4 GB.
  - **P9-B:** how voice input is marked on saved records for pilot measurement.
  - **P9-C:** the read-back default, and whether read-back runs for manual entries.
  - **P9-D:** the maximum recording length.
- **Open questions:** Q-006 for "Sema"; Q-004 if voice relies on cloud parsing.
- **Risks:** R-007 (Swahili STT poor) is mitigated by English only; R-008 (models too heavy) on 3 GB phones; new risk: `speechSynthesis` English voices may be missing or need a network download on some Android builds, so read-back silently doing nothing must be the safe fallback.
