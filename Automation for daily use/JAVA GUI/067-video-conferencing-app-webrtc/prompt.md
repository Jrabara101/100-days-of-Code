# Project #67 — Video Conferencing App (Java + WebRTC)

**Date:** 2026-07-06
**Source list:** `Automation for daily use/JAVA GUI/Now, Deep Research about 100 projects on Java GUI.docx` — Advanced Projects (67–100)

## Senior prompt used

> create a JavaFX GUI with advanced senior developer prompt to generate more visual styling layout and more reasoning logic behind the code. — applied to: **"Video Conferencing App (Java + WebRTC)"**. Build the call-lifecycle and UI layer of a video conferencing app: an explicit call state machine (dialing → negotiating → connected → reconnecting/failed), a signaling/ICE negotiation step that distinguishes transient failures (worth retrying with backoff) from terminal ones (peer rejection — not worth retrying), a near-square participant grid that recalculates as people join/leave, and a per-participant adaptive quality indicator, all in a dark-themed styled JavaFX interface.

## Design reasoning

- **Signaling is simulated, not real WebRTC.** Actual WebRTC media transport needs native bindings (e.g. `webrtc-java`) that aren't installed on this machine, and a real signaling server to talk to. What's implemented for real is the *shape* every WebRTC call goes through: an SDP/ICE negotiation that can fail transiently (`TransientSignalingException` — e.g. ICE gathering timeout, worth a retry) or terminally (`TerminalSignalingException` — e.g. the peer rejected the call, retrying the same offer can't fix that). `CallSession.join()` retries only the transient case, with exponential backoff, capped at 3 attempts — mirroring the retry policy from the PHP payment-sync project (#66).
- **`ConnectionQuality` is an ordered enum, not a raw number.** Packet-loss percentage maps to a quality tier using the same tiered-degradation shape real adaptive-bitrate WebRTC stacks use: drop resolution/framerate before dropping video entirely, audio-only only as a last resort (`ConnectionQuality.fromPacketLossPercent`).
- **`GridLayoutStrategy` encodes real video-conferencing UI reasoning**, not just "N columns": 1 participant fills the tile, 2 sit side-by-side (reads better than a 1×2 stack), and beyond that columns grow as `ceil(sqrt(n))` so tiles stay roughly square instead of thin vertical slivers as more people join.
- **JavaFX `Property` bindings drive the UI**, not manual re-renders — `Participant`'s mic/camera/quality state and `CallSession`'s call state are `SimpleObjectProperty`/`SimpleBooleanProperty`/`ObservableList`, so the status bar and tiles update automatically via listeners when state changes mid-call, the same pattern a production JavaFX app uses to avoid manual UI-sync bugs.

## Files

- `src/CallState.java` — call lifecycle enum.
- `src/ConnectionQuality.java` — tiered quality enum + packet-loss mapping.
- `src/Participant.java` — observable participant model (JavaFX properties).
- `src/SignalingException.java`, `src/TransientSignalingException.java`, `src/TerminalSignalingException.java` — retryable vs. non-retryable signaling failures.
- `src/SignalingClient.java`, `src/SimulatedSignalingClient.java` — negotiation abstraction + simulated implementation.
- `src/GridLayoutStrategy.java` — near-square tile grid sizing.
- `src/CallSession.java` — orchestrates negotiation, retry/backoff, and quality sampling.
- `src/VideoConferenceApp.java` — the JavaFX `Application`: dark-themed status bar, participant tile grid, pill-styled mute/camera/leave controls.

## Compile check

This is a GUI app — there's no terminal output to capture the way a CLI script has. Instead of launching a live window (risky to do unattended, and JavaFX's native toolkit thread doesn't reliably exit even without calling `launch()`), each day's automation compiles the code against the JavaFX SDK to prove it's correct:

```
javac --module-path "C:\tools\javafx-sdk-26.0.1\lib" --add-modules javafx.controls,javafx.graphics,javafx.base -d out src/*.java
```

Result: **compiled cleanly, 0 errors**, 13 class files produced in `out/`.

## Layout summary (text preview, in place of a screenshot)

```
┌──────────────────────────────────────────────────────────────┐
│ ● Connected                                          (status bar) │
├──────────────────────────────────────────────────────────────┤
│ ┌───────────────┐  ┌───────────────┐                          │
│ │ Maria Santos  │  │ Alex Cruz     │   2x2 near-square grid    │
│ │ HD 720p       │  │ HD 720p       │   (4 participants →       │
│ ├───────────────┤  ├───────────────┤    ceil(sqrt(4))=2 cols)  │
│ │ Jomari Reyes  │  │ Dana Lim      │                           │
│ │ SD 480p       │  │ HD 720p       │                           │
│ └───────────────┘  └───────────────┘                          │
├──────────────────────────────────────────────────────────────┤
│      [ Mute ]      [ Camera Off ]      [ Leave Call ]         │
└──────────────────────────────────────────────────────────────┘
```

## Status

Marked complete in `Now, Deep Research about 100 projects on Java GUI.docx` (item #67, "Video Conferencing App (Java + WebRTC)", highlighted red). Next up: **#68 — Secure File Transfer Tool (Java SFTP)**.
