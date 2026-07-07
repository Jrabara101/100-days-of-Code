import javafx.beans.property.*;
import java.time.Instant;

/**
 * Orchestrates the two-factor authentication flow for one login attempt.
 *
 * Flow:  IDLE → AWAITING_PASSWORD → AWAITING_TOTP → AUTHENTICATED
 *                                                  ↓
 *                                             LOCKED_OUT (after 3 bad codes)
 *
 * Lockout reasoning: 3 bad TOTP attempts trigger a lockout because TOTP codes
 * are only valid for ~90s across 3 windows. Allowing more attempts would let
 * an attacker brute-force a 6-digit space (10^6) given enough time windows.
 * After lockout, a new AuthSession must be created; account re-authentication
 * starts fresh (no in-memory state carries over).
 */
public class AuthSession {

    private static final int MAX_TOTP_ATTEMPTS = 3;

    private final AccountStore store;
    private final ObjectProperty<AuthState> state =
            new SimpleObjectProperty<>(AuthState.IDLE);
    private final StringProperty statusMessage = new SimpleStringProperty("Enter your username.");
    private final StringProperty authenticatedUser = new SimpleStringProperty();
    private final IntegerProperty totpAttemptsLeft =
            new SimpleIntegerProperty(MAX_TOTP_ATTEMPTS);

    private TotpSecret currentAccount;
    private int totpAttempts;

    public AuthSession(AccountStore store) {
        this.store = store;
    }

    public void beginLogin() {
        assertState(AuthState.IDLE);
        transition(AuthState.AWAITING_PASSWORD, "Enter username and password.");
    }

    public boolean submitPassword(String username, String rawPassword) {
        assertState(AuthState.AWAITING_PASSWORD);
        var optAccount = store.findByUsername(username);
        if (optAccount.isEmpty()) {
            statusMessage.set("Unknown username.");
            return false;
        }
        TotpSecret account = optAccount.get();
        String hashed = TotpSecret.hashPassword(rawPassword);
        if (!hashed.equals(account.getPasswordHash())) {
            statusMessage.set("Incorrect password.");
            return false;
        }
        currentAccount = account;

        if (!account.isEnrolled()) {
            // First-time login: go to enrollment flow instead
            transition(AuthState.ENROLLMENT, "Account not yet enrolled in 2FA. Scan the QR secret.");
            return true;
        }
        totpAttempts = 0;
        totpAttemptsLeft.set(MAX_TOTP_ATTEMPTS);
        transition(AuthState.AWAITING_TOTP, "Password accepted. Enter your authenticator code.");
        return true;
    }

    public void submitTotpCode(String code) throws TotpException {
        assertState(AuthState.AWAITING_TOTP);

        long now = Instant.now().getEpochSecond();
        long matchedStep = TotpAlgorithm.verify(currentAccount.getBase32Secret(), code, now);

        if (matchedStep < 0) {
            totpAttempts++;
            int remaining = MAX_TOTP_ATTEMPTS - totpAttempts;
            totpAttemptsLeft.set(remaining);

            if (code.matches("\\d{6}")) {
                // Structurally valid code but no window matched → skewed clock
                // We can't distinguish "wrong code" from "clock drift" with certainty,
                // but if this is the 3rd failure, treat it as non-retryable.
                if (remaining == 0) {
                    currentAccount.incrementFailedAttempts();
                    transition(AuthState.LOCKED_OUT, "Too many failed attempts. Session locked.");
                    throw new ExpiredWindowException(now);
                }
            }

            if (remaining == 0) {
                currentAccount.incrementFailedAttempts();
                transition(AuthState.LOCKED_OUT, "Too many failed attempts. Session locked.");
                throw new InvalidCodeException(0);
            }
            throw new InvalidCodeException(remaining);
        }

        // Replay attack guard: each 30s step can only authenticate once per account
        if (currentAccount.isStepAlreadyUsed(matchedStep)) {
            // Treat as invalid — same code replayed in same window
            totpAttempts++;
            int remaining = MAX_TOTP_ATTEMPTS - totpAttempts;
            totpAttemptsLeft.set(remaining);
            if (remaining == 0) {
                transition(AuthState.LOCKED_OUT, "Too many failed attempts. Session locked.");
                throw new InvalidCodeException(0);
            }
            throw new InvalidCodeException(remaining);
        }

        currentAccount.recordUsedStep(matchedStep);
        currentAccount.resetFailedAttempts();
        authenticatedUser.set(currentAccount.getUsername());
        transition(AuthState.AUTHENTICATED,
                "Authenticated successfully as " + currentAccount.getUsername() + ".");
    }

    public void enrollAccount(String rawEnrollmentPassword) {
        assertState(AuthState.ENROLLMENT);
        // Re-verify password as confirmation before enrolling
        if (!TotpSecret.hashPassword(rawEnrollmentPassword).equals(currentAccount.getPasswordHash())) {
            statusMessage.set("Enrollment confirmation: wrong password.");
            return;
        }
        String newSecret = TotpAlgorithm.generateSecret();
        currentAccount.enroll(newSecret);
        totpAttempts = 0;
        totpAttemptsLeft.set(MAX_TOTP_ATTEMPTS);
        transition(AuthState.AWAITING_TOTP,
                "Enrolled! Scan the secret in your authenticator, then enter the first code.");
    }

    public TotpSecret getCurrentAccount() { return currentAccount; }

    public ObjectProperty<AuthState> stateProperty() { return state; }
    public StringProperty statusMessageProperty() { return statusMessage; }
    public StringProperty authenticatedUserProperty() { return authenticatedUser; }
    public IntegerProperty totpAttemptsLeftProperty() { return totpAttemptsLeft; }

    public AuthState getState() { return state.get(); }

    private void assertState(AuthState expected) {
        if (state.get() != expected) {
            throw new IllegalStateException(
                    "Expected state " + expected + " but was " + state.get());
        }
    }

    private void transition(AuthState next, String message) {
        state.set(next);
        statusMessage.set(message);
    }
}
