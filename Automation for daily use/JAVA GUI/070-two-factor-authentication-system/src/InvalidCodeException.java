/**
 * The submitted TOTP code did not match the expected value.
 * Retryable — the user may enter a new code (subject to attempt limits).
 */
public class InvalidCodeException extends TotpException {
    private final int attemptsRemaining;

    public InvalidCodeException(int attemptsRemaining) {
        super("Invalid TOTP code. Attempts remaining: " + attemptsRemaining);
        this.attemptsRemaining = attemptsRemaining;
    }

    public int getAttemptsRemaining() {
        return attemptsRemaining;
    }

    @Override
    public boolean isRetryable() {
        return attemptsRemaining > 0;
    }
}
