import javafx.beans.property.SimpleBooleanProperty;
import javafx.beans.property.SimpleIntegerProperty;
import javafx.beans.property.SimpleStringProperty;

/**
 * Observable model for a rectangular region of the remote desktop surface.
 *
 * Each region tracks its own dirty state and generation counter. The delta-
 * encoding decision lives in {@link FrameEncodingStrategy}: a region that
 * has been unchanged for several frames should send only a heartbeat, not
 * a full pixel dump, to avoid saturating the RMI channel with redundant data.
 *
 * A real RMI remote desktop would pass {@code byte[]} pixel payloads; here
 * the payload is simulated as an encoded description string so the model
 * and reasoning are exercised without requiring a live framebuffer.
 */
public final class ScreenRegion {

    private final int col;
    private final int row;
    private final SimpleStringProperty encodedPayload = new SimpleStringProperty("[blank]");
    private final SimpleBooleanProperty dirty = new SimpleBooleanProperty(false);
    private final SimpleIntegerProperty generation = new SimpleIntegerProperty(0);

    public ScreenRegion(int col, int row) {
        this.col = col;
        this.row = row;
    }

    public int col() { return col; }
    public int row() { return row; }

    public SimpleStringProperty encodedPayloadProperty() { return encodedPayload; }
    public SimpleBooleanProperty dirtyProperty() { return dirty; }
    public SimpleIntegerProperty generationProperty() { return generation; }

    /** Called by the simulated server feed when this region's pixels changed. */
    public void markDirty(String newPayload) {
        dirty.set(true);
        encodedPayload.set(newPayload);
        generation.set(generation.get() + 1);
    }

    /** Called after the encoded frame is dispatched over the RMI channel. */
    public void acknowledge() {
        dirty.set(false);
    }

    @Override
    public String toString() {
        return String.format("Region[%d,%d] gen=%d dirty=%b", col, row, generation.get(), dirty.get());
    }
}
