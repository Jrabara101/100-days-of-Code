/**
 * Base checked exception for all TOTP verification failures.
 * Subclasses distinguish recoverable from terminal failures so the auth
 * session can decide whether to offer a retry or immediately lock out.
 */
public abstract class TotpException extends Exception {
    public TotpException(String message) {
        super(message);
    }

    /** True if the caller may retry without changing any state. */
    public abstract boolean isRetryable();
}
