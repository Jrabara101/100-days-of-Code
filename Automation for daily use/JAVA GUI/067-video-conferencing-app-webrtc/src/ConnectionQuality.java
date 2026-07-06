/**
 * Mirrors the tiered fallback a real WebRTC stack performs under packet
 * loss: drop resolution/framerate before dropping video entirely, and only
 * fall back to audio-only as a last resort. Ordered worst-to-best so
 * {@code compareTo} can be used to detect degradation vs. recovery.
 */
public enum ConnectionQuality {
    AUDIO_ONLY(0, "Audio only (severe packet loss)"),
    LOW_SD(1, "SD 360p (degraded)"),
    SD(2, "SD 480p"),
    HD(3, "HD 720p"),
    FULL_HD(4, "Full HD 1080p");

    private final int rank;
    private final String label;

    ConnectionQuality(int rank, String label) {
        this.rank = rank;
        this.label = label;
    }

    public int rank() {
        return rank;
    }

    public String label() {
        return label;
    }

    /**
     * Maps a simulated packet-loss percentage to a quality tier. The
     * thresholds follow the same shape real adaptive-bitrate WebRTC
     * stacks use: video degrades well before it's dropped entirely.
     */
    public static ConnectionQuality fromPacketLossPercent(double lossPercent) {
        if (lossPercent >= 25.0) return AUDIO_ONLY;
        if (lossPercent >= 15.0) return LOW_SD;
        if (lossPercent >= 7.0) return SD;
        if (lossPercent >= 2.0) return HD;
        return FULL_HD;
    }
}
