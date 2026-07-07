# Project #70 — Two-Factor Authentication System

**Date:** 2026-07-07
**Source list:** `Automation for daily use/JAVA GUI/Now, Deep Research about 100 projects on Java GUI.docx` — Advanced Projects (67–100)

## Senior prompt used

> create a JavaFX GUI with advanced senior developer prompt to generate more visual styling layout and more reasoning logic behind the code. — applied to: **"Two-Factor Authentication System"**. Build a full TOTP-based two-factor authentication GUI: implement RFC 6238 TOTP from scratch (HMAC-SHA1, dynamic truncation, ±1-window drift tolerance), a checked-exception hierarchy separating retryable from terminal auth failures, a replay-attack guard, a 3-attempt lockout policy, and a multi-screen JavaFX flow (login → TOTP verification → success, plus enrollment and registration screens), all styled with a dark GitHub-inspired theme.

## Design reasoning

- **TOTP is implemented from first principles (RFC 6238 / RFC 4226)** — not delegated to a library. `TotpAlgorithm` uses `HmacSHA1` via `javax.crypto.Mac`, packs the 64-bit counter into big-endian bytes, applies dynamic truncation (last nibble of the HMAC selects a 4-byte offset), and masks to 6 digits. This is the exact algorithm used by Google Authenticator, Authy, and every RFC-compliant TOTP app.

- **±1 window drift tolerance is a deliberate tradeoff.** Accepting codes from the previous and next 30-second window (DRIFT_WINDOWS=1) gives a 90-second validity span. Narrower acceptance breaks on devices with slight clock skew; wider acceptance is a security regression — the RFC 6238 recommendation is ±1, and that is what this implementation uses. The `ExpiredWindowException` fires only when *all three windows reject the code*, signaling a device with severely skewed clock — not worth retrying with the same code.

- **Two-exception hierarchy distinguishes failure modes:** `InvalidCodeException` (wrong code, remaining attempts > 0 → retryable; attempts exhausted → lockout) vs. `ExpiredWindowException` (structurally-valid code outside all windows → clock sync problem, non-retryable). The `AuthSession` catches these to decide whether to offer a retry prompt or immediately transition to `LOCKED_OUT`.

- **Replay-attack guard (step deduplication).** Once a 30-second time-step counter has been used successfully, `TotpSecret.recordUsedStep()` stores it and `isStepAlreadyUsed()` blocks re-use. This prevents an attacker who captures a valid code from reusing it in the same 30-second window — a real gap in naive TOTP implementations that don't track consumed steps.

- **3-attempt lockout** — TOTP codes are 6 decimal digits (10^6 values). Within a single 30-second window only one value is valid. Allowing unlimited attempts would let an attacker brute-force by trying the same code from multiple time windows. 3 attempts is the standard balance: a legitimate user who misread a digit gets two more tries; an attacker burning attempts on a rolling window cannot succeed.

- **`AuthState` enum drives the multi-screen flow** — IDLE → AWAITING_PASSWORD → AWAITING_TOTP → AUTHENTICATED (or LOCKED_OUT), plus an ENROLLMENT branch for first-time logins. The UI listens to `session.stateProperty()` and transitions screens in response, so no screen has to know about other screens' internals.

- **Countdown ring** — The `ProgressIndicator` in the TOTP screen shows remaining time in the current 30-second window. It shifts from accent-blue to amber (≤10s) to red (≤5s), giving the user time to switch to their authenticator and copy the code before it expires — reducing failed attempts from timing, not from wrong codes.

- **JavaFX property bindings** — `statusMessageProperty`, `totpAttemptsLeftProperty`, and `authenticatedUserProperty` on `AuthSession` are bound directly to Labels in the UI, so status updates appear immediately without manual refresh calls, matching production JavaFX patterns.

## Files

- `src/AuthState.java` — auth flow state machine enum (IDLE → AWAITING_PASSWORD → AWAITING_TOTP → AUTHENTICATED / LOCKED_OUT / ENROLLMENT).
- `src/TotpException.java` — abstract base checked exception; defines `isRetryable()` contract.
- `src/InvalidCodeException.java` — wrong TOTP code; retryable while attempts remain.
- `src/ExpiredWindowException.java` — code outside all time windows (clock skew); non-retryable.
- `src/TotpAlgorithm.java` — full RFC 6238 TOTP: HMAC-SHA1, dynamic truncation, base32 encode/decode, drift-window verification, secret generation.
- `src/TotpSecret.java` — observable account model (JavaFX properties): username, hashed password, base32 secret, enrollment state, failed-attempts counter, used-step guard.
- `src/AccountStore.java` — in-memory account registry backed by `ObservableList`; seeds a demo account (admin / secret123).
- `src/AuthSession.java` — orchestrates login flow: password check → TOTP verify with lockout logic, enrollment branch, replay guard.
- `src/TwoFactorAuthApp.java` — JavaFX `Application`: five screens (login, TOTP entry with countdown ring, enrollment, registration, success), dark GitHub-palette theme.

## Compile command

```
javac --module-path "C:\tools\javafx-sdk-26.0.1\lib" --add-modules javafx.controls,javafx.graphics,javafx.base -d out src/*.java
```

Result: **compiled cleanly, 0 errors**

## Layout summary

```
 ┌─────────────────────────────────────────────┐
 │              Sign In                         │  ← Login Screen
 │         Two-Factor Authentication Portal     │
 │  ─────────────────────────────────────────  │
 │  [ Username __________________________ ]    │
 │  [ Password __________________________ ]    │
 │  Demo: admin / secret123 (italic hint)       │
 │  [ Sign In (blue button, full width)  ]      │
 │  Register new account (hyperlink)            │
 └─────────────────────────────────────────────┘

 ┌─────────────────────────────────────────────┐
 │         Authenticator Code                   │  ← TOTP Screen
 │  Enter the 6-digit code from your app.       │
 │  ─────────────────────────────────────────  │
 │         ┌──────┐                             │
 │         │ 23s  │  ← countdown ring (color-   │
 │         └──────┘    shifts blue→amber→red)   │
 │         3 attempts left                      │
 │         ┌──────────────┐                     │
 │         │   000000     │  ← big code input   │
 │         └──────────────┘                     │
 │     [ Verify (blue button) ]                 │
 │  Demo code (refreshes each window): 847201   │
 └─────────────────────────────────────────────┘

 ┌─────────────────────────────────────────────┐
 │              ✓  (green circle)               │  ← Success Screen
 │         Authenticated!                       │
 │   Welcome back, admin.                       │
 │   Identity verified via 2FA.                 │
 │  ─────────────────────────────────────────  │
 │         [ Sign Out (red button) ]            │
 └─────────────────────────────────────────────┘
```

## Status

Marked complete in `Now, Deep Research about 100 projects on Java GUI.docx` (item #70, "Two-Factor Authentication System", highlighted red). Next up: **#71 — Media Security Application**.
