/**
 * Base type for anything that can go wrong while exchanging SDP
 * offers/answers or ICE candidates with the signaling server. Split into
 * {@link TransientSignalingException} and {@link TerminalSignalingException}
 * subtypes so calling code can decide "retry" vs. "give up" by catching the
 * specific subtype rather than inspecting error codes/strings.
 */
public abstract class SignalingException extends Exception {
    protected SignalingException(String message) {
        super(message);
    }
}
