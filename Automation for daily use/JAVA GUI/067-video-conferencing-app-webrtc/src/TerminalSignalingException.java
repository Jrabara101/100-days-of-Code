/**
 * Not recoverable by retrying: the remote peer explicitly rejected the
 * call, or codec negotiation found zero common codecs. Retrying the same
 * offer would just fail again, so the caller should go straight to
 * {@link CallState#FAILED} instead of burning a retry budget.
 */
public final class TerminalSignalingException extends SignalingException {
    public TerminalSignalingException(String message) {
        super(message);
    }
}
