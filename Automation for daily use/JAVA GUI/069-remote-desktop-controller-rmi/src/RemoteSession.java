import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.BlockingQueue;
import javafx.beans.property.SimpleObjectProperty;
import javafx.beans.property.SimpleStringProperty;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;

/**
 * Owns the full RMI session lifecycle: connection (with retry/backoff for
 * transient failures only), the observable framebuffer grid, and the input
 * event dispatch queue.
 *
 * Two domain-specific invariants this class enforces:
 *
 * 1. Authentication failures are never retried. Retrying a bad password just
 *    triggers account lockout on the remote host — a transient/terminal
 *    distinction that naive "retry everything N times" patterns miss.
 *
 * 2. Input events are dispatched in arrival order (single BlockingQueue) so
 *    mouse and keyboard events to the same remote target can't be reordered
 *    across separate queues. The session drains the queue in the frame-pump
 *    thread on each tick, not in a separate sender thread, to avoid racing
 *    a framebuffer poll that expects the input to have landed first.
 */
public final class RemoteSession {

    private static final int MAX_CONNECT_ATTEMPTS = 3;
    /** Capacity chosen so a brief network hiccup doesn't drop events. */
    private static final int INPUT_QUEUE_CAPACITY = 128;

    private final RmiTransport transport;
    private final SimpleObjectProperty<SessionState> state =
            new SimpleObjectProperty<>(SessionState.IDLE);
    private final SimpleStringProperty lastError = new SimpleStringProperty("");
    private final ObservableList<ScreenRegion> regions = FXCollections.observableArrayList();
    private final BlockingQueue<InputEvent> inputQueue =
            new ArrayBlockingQueue<>(INPUT_QUEUE_CAPACITY);

    /** Latency of the last RMI round-trip in ms (updated by the frame pump). */
    private final SimpleStringProperty latencyLabel = new SimpleStringProperty("-- ms");

    public RemoteSession(RmiTransport transport) {
        this.transport = transport;
        initRegionGrid(4, 3);
    }

    private void initRegionGrid(int cols, int rows) {
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                regions.add(new ScreenRegion(c, r));
            }
        }
    }

    // --- Properties ----------------------------------------------------------

    public SimpleObjectProperty<SessionState> stateProperty() { return state; }
    public SimpleStringProperty lastErrorProperty() { return lastError; }
    public ObservableList<ScreenRegion> regions() { return regions; }
    public SimpleStringProperty latencyLabelProperty() { return latencyLabel; }

    // --- Session lifecycle ---------------------------------------------------

    public void connect(String host, int port, String username, String password) {
        state.set(SessionState.CONNECTING);
        int attempt = 0;
        while (true) {
            attempt++;
            try {
                state.set(SessionState.AUTHENTICATING);
                transport.connect(host, port, username, password);
                state.set(SessionState.ACTIVE);
                return;
            } catch (TerminalRmiException e) {
                // Never retry authentication rejection — doing so risks locking out the account.
                lastError.set(e.getMessage());
                state.set(SessionState.FAILED);
                return;
            } catch (TransientRmiException e) {
                lastError.set(e.getMessage());
                if (attempt >= MAX_CONNECT_ATTEMPTS) {
                    state.set(SessionState.FAILED);
                    return;
                }
                state.set(SessionState.RECONNECTING);
                sleepQuietly(150L * (1L << attempt)); // exponential backoff
                state.set(SessionState.CONNECTING);
            } catch (RmiException e) {
                // Unknown subtype — treat as non-retryable so we don't silently loop forever.
                lastError.set(e.getMessage());
                state.set(SessionState.FAILED);
                return;
            }
        }
    }

    public void disconnect() {
        state.set(SessionState.DISCONNECTING);
        transport.disconnect();
        state.set(SessionState.IDLE);
        resetRegions();
        latencyLabel.set("-- ms");
    }

    // --- Frame pump (called by the UI timer on each tick) --------------------

    /**
     * One frame-pump tick: drain the input queue, send to remote, then poll
     * dirty regions and update the observable framebuffer grid.
     */
    public void tick() {
        if (state.get() != SessionState.ACTIVE) return;

        // 1. Drain and send queued input events
        List<InputEvent> batch = new ArrayList<>();
        inputQueue.drainTo(batch);
        if (!batch.isEmpty()) {
            try {
                transport.sendInputBatch(batch);
            } catch (TransientRmiException e) {
                // Re-queue events on transient failure — they haven't landed yet.
                for (InputEvent ev : batch) {
                    inputQueue.offer(ev); // offer (non-blocking) to avoid deadlock
                }
            } catch (RmiException e) {
                lastError.set("Input send failed: " + e.getMessage());
                // Don't transition to FAILED — a single send glitch shouldn't drop the session.
            }
        }

        // 2. Poll framebuffer dirty regions
        long start = System.currentTimeMillis();
        try {
            List<String> dirtyCoords = transport.pollDirtyRegions();
            long rtt = System.currentTimeMillis() - start;
            latencyLabel.set(rtt + " ms");
            for (String coord : dirtyCoords) {
                String[] parts = coord.split(",");
                if (parts.length == 2) {
                    int col = Integer.parseInt(parts[0]);
                    int row = Integer.parseInt(parts[1]);
                    findRegion(col, row).ifPresent(region -> {
                        FrameEncodingStrategy.EncodingDecision decision =
                                FrameEncodingStrategy.decide(region);
                        String payload = FrameEncodingStrategy.label(decision)
                                + " @ gen " + (region.generationProperty().get() + 1);
                        region.markDirty(payload);
                        region.acknowledge();
                    });
                }
            }
        } catch (RmiException e) {
            latencyLabel.set("error");
        }
    }

    // --- Input dispatch ------------------------------------------------------

    /** Non-blocking enqueue — if the queue is full, the event is dropped (backpressure). */
    public void enqueueInput(InputEvent event) {
        if (state.get() == SessionState.ACTIVE) {
            inputQueue.offer(event);
        }
    }

    // --- Helpers -------------------------------------------------------------

    private java.util.Optional<ScreenRegion> findRegion(int col, int row) {
        return regions.stream()
                .filter(r -> r.col() == col && r.row() == row)
                .findFirst();
    }

    private void resetRegions() {
        for (ScreenRegion r : regions) {
            r.dirtyProperty().set(false);
            r.encodedPayloadProperty().set("[blank]");
            r.generationProperty().set(0);
        }
    }

    private static void sleepQuietly(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
