/**
 * The code was structurally valid (6-digit, correct format) but fell outside
 * all accepted time windows — meaning the device clock is too far skewed.
 * Not retryable with the same code; user needs to check device clock sync.
 */
public class ExpiredWindowException extends TotpException {
    private final long serverEpoch;

    public ExpiredWindowException(long serverEpoch) {
        super("TOTP code is outside the valid time window. Check device clock sync.");
        this.serverEpoch = serverEpoch;
    }

    public long getServerEpoch() {
        return serverEpoch;
    }

    @Override
    public boolean isRetryable() {
        return false;
    }
}
