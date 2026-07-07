/**
 * Decides whether a given screen region needs a full-frame refresh or only
 * a delta update over the RMI channel.
 *
 * The rule captures a real tradeoff in remote-desktop protocols (RFB/RDP alike):
 * sending a full pixel block for every region every frame is wasteful when most
 * of the desktop is static. But after too many delta-only frames, accumulated
 * quantization drift in a real codec makes a full resync mandatory. We model
 * this with a generation counter:
 *
 *   - First frame after a dirty event → full frame (establish reference).
 *   - Frames 2..DELTA_LIMIT → delta-only (cheaper to transmit).
 *   - Every REFRESH_INTERVAL generations → forced full refresh (drift reset).
 *   - Clean (unchanged) region → skip entirely (heartbeat only).
 *
 * This avoids the common bug of forcing a full refresh on every timer tick,
 * which saturates the RMI channel and destroys interactivity at high screen sizes.
 */
public final class FrameEncodingStrategy {

    /** Send delta-only until this many consecutive updates, then force a full refresh. */
    private static final int REFRESH_INTERVAL = 10;

    public enum EncodingDecision { SKIP, DELTA, FULL_REFRESH }

    private FrameEncodingStrategy() {}

    public static EncodingDecision decide(ScreenRegion region) {
        if (!region.dirtyProperty().get()) {
            return EncodingDecision.SKIP;
        }
        int gen = region.generationProperty().get();
        if (gen == 1 || gen % REFRESH_INTERVAL == 0) {
            return EncodingDecision.FULL_REFRESH;
        }
        return EncodingDecision.DELTA;
    }

    /** Human-readable label used by the UI to show encoding mode per region. */
    public static String label(EncodingDecision decision) {
        return switch (decision) {
            case SKIP         -> "idle";
            case DELTA        -> "delta";
            case FULL_REFRESH -> "full";
        };
    }
}
