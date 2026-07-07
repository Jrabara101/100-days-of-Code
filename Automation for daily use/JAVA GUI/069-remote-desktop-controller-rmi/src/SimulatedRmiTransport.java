import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Simulates the RMI transport layer so the session manager, encoding strategy,
 * and UI can be exercised without a live RMI registry or remote host.
 *
 * Behavior is intentionally probabilistic:
 *  - connect() succeeds after a short delay; rejects bad credentials terminally.
 *  - pollDirtyRegions() randomly marks 1–4 regions dirty each cycle.
 *  - sendInputBatch() has a 10% chance of a transient failure to exercise the
 *    session manager's retry path without overwhelming it.
 */
public final class SimulatedRmiTransport implements RmiTransport {

    private static final String VALID_USER     = "admin";
    private static final String VALID_PASSWORD = "secret";

    private volatile boolean connected = false;

    @Override
    public void connect(String host, int port, String username, String password) throws RmiException {
        simulateNetworkDelay(80, 200);
        if (!VALID_USER.equals(username) || !VALID_PASSWORD.equals(password)) {
            throw new TerminalRmiException("Authentication rejected for user '" + username + "'");
        }
        // 15% chance of transient stub-lookup failure (registry temporarily unreachable)
        if (ThreadLocalRandom.current().nextDouble() < 0.15) {
            throw new TransientRmiException("RMI registry lookup timed out on " + host + ":" + port);
        }
        connected = true;
    }

    @Override
    public void sendInputBatch(List<InputEvent> events) throws RmiException {
        if (!connected) throw new TransientRmiException("Not connected");
        // 10% transient marshal failure — simulates a briefly-stale stub reference
        if (ThreadLocalRandom.current().nextDouble() < 0.10) {
            throw new TransientRmiException("Input marshal failed: stub stale, will retry");
        }
        simulateNetworkDelay(5, 30);
    }

    @Override
    public List<String> pollDirtyRegions() throws RmiException {
        if (!connected) throw new TransientRmiException("Not connected");
        simulateNetworkDelay(10, 40);
        // Return 0–3 randomly dirty region coordinates (col,row)
        int count = ThreadLocalRandom.current().nextInt(0, 4);
        List<String> dirty = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            int col = ThreadLocalRandom.current().nextInt(0, 4);
            int row = ThreadLocalRandom.current().nextInt(0, 3);
            dirty.add(col + "," + row);
        }
        return dirty;
    }

    @Override
    public void disconnect() {
        connected = false;
    }

    private void simulateNetworkDelay(int minMs, int maxMs) {
        long delay = ThreadLocalRandom.current().nextLong(minMs, maxMs + 1L);
        try {
            Thread.sleep(delay);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
