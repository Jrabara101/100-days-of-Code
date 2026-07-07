/**
 * A transient RMI failure: network timeout, temporary stub lookup failure,
 * or an intermittent marshal error. These are safe to retry with backoff
 * because the remote object likely still exists and will answer on the next attempt.
 */
public final class TransientRmiException extends RmiException {
    public TransientRmiException(String message) {
        super(message);
    }
}
