/**
 * Recoverable: ICE gathering timeout, a dropped signaling-server
 * websocket frame, a STUN request that timed out. Worth retrying with
 * backoff before falling back to a TURN relay.
 */
public final class TransientSignalingException extends SignalingException {
    public TransientSignalingException(String message) {
        super(message);
    }
}
