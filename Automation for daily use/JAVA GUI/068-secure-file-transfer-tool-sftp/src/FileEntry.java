import javafx.beans.property.*;

/** Observable model for a single file queued for transfer. */
public class FileEntry {

    public enum Direction { UPLOAD, DOWNLOAD }

    private final StringProperty name = new SimpleStringProperty();
    private final LongProperty sizeBytes = new SimpleLongProperty();
    private final DoubleProperty progress = new SimpleDoubleProperty(0.0);
    private final ObjectProperty<TransferState> state = new SimpleObjectProperty<>(TransferState.IDLE);
    private final StringProperty checksum = new SimpleStringProperty("");
    private final ObjectProperty<Direction> direction = new SimpleObjectProperty<>(Direction.UPLOAD);

    public FileEntry(String name, long sizeBytes, Direction direction) {
        this.name.set(name);
        this.sizeBytes.set(sizeBytes);
        this.direction.set(direction);
    }

    // --- property accessors ---
    public StringProperty nameProperty() { return name; }
    public LongProperty sizeBytesProperty() { return sizeBytes; }
    public DoubleProperty progressProperty() { return progress; }
    public ObjectProperty<TransferState> stateProperty() { return state; }
    public StringProperty checksumProperty() { return checksum; }
    public ObjectProperty<Direction> directionProperty() { return direction; }

    public String getName() { return name.get(); }
    public long getSizeBytes() { return sizeBytes.get(); }
    public double getProgress() { return progress.get(); }
    public TransferState getState() { return state.get(); }
    public String getChecksum() { return checksum.get(); }
    public Direction getDirection() { return direction.get(); }

    public void setProgress(double v) { progress.set(v); }
    public void setState(TransferState s) { state.set(s); }
    public void setChecksum(String c) { checksum.set(c); }

    /** Human-readable file size, matching the convention used in OS file browsers. */
    public String formattedSize() {
        long b = sizeBytes.get();
        if (b < 1024) return b + " B";
        if (b < 1024 * 1024) return String.format("%.1f KB", b / 1024.0);
        if (b < 1024L * 1024 * 1024) return String.format("%.1f MB", b / (1024.0 * 1024));
        return String.format("%.2f GB", b / (1024.0 * 1024 * 1024));
    }
}
