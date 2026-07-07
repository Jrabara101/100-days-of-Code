# Project #69 — Remote Desktop Controller (Java RMI)

**Date:** 2026-07-07
**Source list:** `Automation for daily use/JAVA GUI/Now, Deep Research about 100 projects on Java GUI.docx` — Advanced Projects (67–100)

## Senior prompt used

> create a JavaFX GUI with advanced senior developer prompt to generate more visual styling layout and more reasoning logic behind the code. — applied to: **"Remote Desktop Controller (Java RMI)"**. Build the session lifecycle and UI layer of a remote desktop controller: an explicit session state machine (connecting → authenticating → active → disconnecting), an RMI transport abstraction that distinguishes transient failures (network timeout, stub stale — worth retrying) from terminal ones (authentication rejection — never retry), a simulated framebuffer grid whose regions use a delta-vs-full-refresh encoding decision, a single-queue input event dispatcher that preserves mouse/keyboard ordering, and a dark-themed styled JavaFX interface with live state and latency feedback.

## Design reasoning

- **RMI transport is simulated, not a live rmiregistry stub.** A real implementation would call `Naming.lookup("rmi://host:1099/RemoteDesktop")` and delegate through a `Remote` interface. What's implemented for real is the *shape* every RMI remote-desktop client goes through: a connect/authenticate round-trip that can fail transiently (`TransientRmiException` — e.g. registry timeout, safe to retry with backoff) or terminally (`TerminalRmiException` — authentication rejected; retrying the same credentials risks account lockout on the remote host). `RemoteSession.connect()` retries only transient failures, with exponential backoff capped at 3 attempts.

- **`FrameEncodingStrategy` encodes a real remote-desktop protocol decision.** Sending a full pixel block for every screen region on every timer tick is wasteful when most of the desktop is static. The strategy uses a generation counter: first update after a dirty event → full refresh (establish reference); subsequent updates → delta-only; every 10th generation → forced full resync (prevents accumulated quantization drift in a real codec). This avoids the common bug of force-refreshing everything on each tick, which saturates the RMI channel.

- **Input events use a single `BlockingQueue`, not separate mouse and keyboard queues.** Interleaving mouse and keyboard events across two parallel queues can reorder a "click then type" sequence that the remote app sees as "type then click." A single FIFO queue with `drainTo()` on each frame-pump tick preserves arrival order across event kinds. Events that fail to send on a transient RMI error are re-queued (non-blocking `offer`) so they're not lost.

- **Authentication failures are never retried.** `TerminalRmiException` exits the connect loop immediately instead of exhausting retries. Blindly retrying a bad password is the exact mechanism that triggers account lockout policies on real remote hosts — a transient/terminal distinction that naive "retry everything N times" patterns miss.

- **JavaFX `Property` bindings drive the UI.** `RemoteSession`'s state, latency, and each `ScreenRegion`'s dirty flag and payload are `SimpleObjectProperty`/`SimpleBooleanProperty`/`SimpleStringProperty`. Listeners on the FX thread (via `Platform.runLater`) update tile highlights and the status bar automatically — no manual UI-sync polling needed.

## Files

- `src/SessionState.java` — session lifecycle enum (IDLE → CONNECTING → AUTHENTICATING → ACTIVE → DISCONNECTING/FAILED/RECONNECTING).
- `src/RmiException.java` — base checked exception for RMI failures.
- `src/TransientRmiException.java` — transient failure (network timeout, stale stub); safe to retry.
- `src/TerminalRmiException.java` — terminal failure (auth rejected); never retry.
- `src/ScreenRegion.java` — observable model for a framebuffer tile (JavaFX properties for dirty state, payload, generation counter).
- `src/FrameEncodingStrategy.java` — delta-vs-full-refresh encoding decision per region.
- `src/InputEvent.java` — unified mouse/keyboard event record (single queue preserves ordering).
- `src/RmiTransport.java` — RMI transport interface (connect, sendInputBatch, pollDirtyRegions, disconnect).
- `src/SimulatedRmiTransport.java` — simulated transport with probabilistic dirty regions and transient failure injection.
- `src/RemoteSession.java` — orchestrates lifecycle, retry/backoff, single-queue input dispatch, and frame-pump tick.
- `src/RemoteDesktopApp.java` — the JavaFX `Application`: dark-themed status bar, 4×3 framebuffer region grid, connection form, RTT label, and frame pump Timeline.

## Compile check

```
javac --module-path "C:\tools\javafx-sdk-26.0.1\lib" --add-modules javafx.controls,javafx.graphics,javafx.base -d out src\SessionState.java src\RmiException.java src\TransientRmiException.java src\TerminalRmiException.java src\ScreenRegion.java src\FrameEncodingStrategy.java src\InputEvent.java src\RmiTransport.java src\SimulatedRmiTransport.java src\RemoteSession.java src\RemoteDesktopApp.java
```

Result: **compiled cleanly, 0 errors**, 15 class files produced in `out/`.

## Layout summary (text preview, in place of a screenshot)

```
┌──────────────────────────────────────────────────────────────────────┐
│ ● Connected — streaming                         RTT: 24 ms           │  ← status bar
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐│
│  │ 0×0         │  │ 1×0         │  │ 2×0 [teal]  │  │ 3×0         ││
│  │ idle        │  │ delta@gen3  │  │ full @gen1  │  │ idle        ││  ← row 0
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘│
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐│
│  │ 0×1 [teal]  │  │ 1×1         │  │ 2×1         │  │ 3×1 [teal]  ││
│  │ full @gen1  │  │ idle        │  │ delta@gen2  │  │ full @gen1  ││  ← row 1
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘│
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐│
│  │ 0×2         │  │ 1×2 [teal]  │  │ 2×2         │  │ 3×2         ││
│  │ idle        │  │ delta@gen5  │  │ idle        │  │ idle        ││  ← row 2
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘│
│                  teal = dirty/recently updated region                │
├──────────────────────────────────────────────────────────────────────┤
│ Host: [localhost] Port: [1099] User: [admin] Pass: [••••••]          │
│ [ Connect ]  [ Disconnect ]  [ Send Key ]                            │
└──────────────────────────────────────────────────────────────────────┘
```

## Status

Marked complete in `Now, Deep Research about 100 projects on Java GUI.docx` (item #69, "Remote Desktop Controller (Java RMI)", highlighted red). Next up: **#70 — Two-Factor Authentication System**.
