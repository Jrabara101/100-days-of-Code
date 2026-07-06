import java.util.List;

/**
 * Abstraction over the signaling server (in a real app: a websocket
 * exchanging SDP/ICE JSON messages). Kept as an interface so the UI layer
 * and call state machine never depend on the transport, only on the
 * negotiation outcome.
 */
public interface SignalingClient {

    /**
     * Performs SDP offer/answer + ICE candidate exchange for a call to
     * {@code roomId}. Returns the resolved participant roster on success.
     *
     * @throws TransientSignalingException on a recoverable failure (retry with backoff)
     * @throws TerminalSignalingException  on a non-recoverable rejection
     */
    List<Participant> negotiate(String roomId) throws SignalingException;
}
