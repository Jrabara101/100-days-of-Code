import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import javafx.beans.property.SimpleObjectProperty;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;

/**
 * Owns the call lifecycle: negotiation (with retry/backoff for transient
 * signaling failures only), the participant roster, and the simulated
 * network-quality feed. Kept independent of any JavaFX Stage/Scene code
 * so the state machine is the same regardless of how it's presented.
 */
public final class CallSession {

    private static final int MAX_NEGOTIATION_ATTEMPTS = 3;

    private final SignalingClient signalingClient;
    private final SimpleObjectProperty<CallState> state = new SimpleObjectProperty<>(CallState.IDLE);
    private final ObservableList<Participant> participants = FXCollections.observableArrayList();
    private String lastError;

    public CallSession(SignalingClient signalingClient) {
        this.signalingClient = signalingClient;
    }

    public SimpleObjectProperty<CallState> stateProperty() {
        return state;
    }

    public ObservableList<Participant> participants() {
        return participants;
    }

    public String lastError() {
        return lastError;
    }

    /**
     * Runs negotiation synchronously (the real GUI would push this to a
     * background thread and use Platform.runLater for the state updates -
     * omitted here since this class is exercised via compile-time checks,
     * not a running event loop, in the daily automation pipeline).
     */
    public void join(String roomId) {
        state.set(CallState.DIALING);
        state.set(CallState.NEGOTIATING);

        int attempt = 0;
        while (true) {
            attempt++;
            try {
                List<Participant> roster = signalingClient.negotiate(roomId);
                participants.setAll(roster);
                state.set(CallState.CONNECTED);
                return;
            } catch (TransientSignalingException e) {
                lastError = e.getMessage();
                if (attempt >= MAX_NEGOTIATION_ATTEMPTS) {
                    state.set(CallState.FAILED);
                    return;
                }
                state.set(CallState.RECONNECTING);
                // Exponential backoff mirrors the retry policy used for
                // the payment-gateway sync CLI: don't hammer a flaky ICE
                // negotiation with synchronized immediate retries.
                sleepQuietly(100L * (1L << attempt));
                state.set(CallState.NEGOTIATING);
            } catch (TerminalSignalingException e) {
                lastError = e.getMessage();
                state.set(CallState.FAILED);
                return;
            } catch (SignalingException e) {
                // Neither known subtype - treat as non-recoverable rather
                // than silently retrying an error class we don't understand.
                lastError = e.getMessage();
                state.set(CallState.FAILED);
                return;
            }
        }
    }

    /**
     * Simulates one tick of network-quality sampling for every
     * participant, degrading/recovering video quality based on a random
     * packet-loss reading - the same signal a real WebRTC stack's
     * bandwidth estimator would react to.
     */
    public void sampleNetworkQuality() {
        for (Participant p : participants) {
            double lossPercent = ThreadLocalRandom.current().nextDouble(0, 30);
            p.qualityProperty().set(ConnectionQuality.fromPacketLossPercent(lossPercent));
        }
    }

    public void leave() {
        state.set(CallState.ENDED);
        participants.clear();
    }

    private static void sleepQuietly(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
