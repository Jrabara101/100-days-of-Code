import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Stands in for a real signaling server + ICE agent. There is no actual
 * network I/O here (no libwebrtc/native bindings on this machine) - the
 * point is to exercise the same negotiation *shape* a real WebRTC call
 * goes through: an SDP/ICE round trip that can transiently fail (worth
 * retrying) or be terminally rejected (not worth retrying), so the call
 * state machine and retry policy have something real to react to.
 */
public final class SimulatedSignalingClient implements SignalingClient {

    private int attempt = 0;

    @Override
    public List<Participant> negotiate(String roomId) throws SignalingException {
        attempt++;

        // Simulate the ICE agent occasionally needing a TURN relay retry
        // on the first attempt (e.g. symmetric NAT on one side) - this is
        // exactly the class of failure that a second attempt can resolve.
        if (attempt == 1 && ThreadLocalRandom.current().nextInt(100) < 35) {
            throw new TransientSignalingException(
                    "ICE candidate gathering timed out (host + srflx candidates only, no relay yet)");
        }

        // A room name ending in "-locked" simulates the peer explicitly
        // declining the call - retrying the same offer can't fix that.
        if (roomId.endsWith("-locked")) {
            throw new TerminalSignalingException("Remote peer rejected the call (room locked)");
        }

        return List.of(
                new Participant("p-1", "Maria Santos"),
                new Participant("p-2", "Alex Cruz"),
                new Participant("p-3", "Jomari Reyes"),
                new Participant("p-4", "Dana Lim")
        );
    }
}
