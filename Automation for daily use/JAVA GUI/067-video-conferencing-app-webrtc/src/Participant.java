import javafx.beans.property.SimpleBooleanProperty;
import javafx.beans.property.SimpleObjectProperty;
import javafx.beans.property.SimpleStringProperty;

/**
 * A remote participant's observable state. JavaFX properties (not plain
 * fields) are used deliberately so the tile UI can bind directly to them
 * and repaint automatically when mic/camera/quality change mid-call,
 * instead of the app needing to manually re-render tiles on every event.
 */
public final class Participant {

    private final String id;
    private final SimpleStringProperty displayName;
    private final SimpleBooleanProperty micMuted = new SimpleBooleanProperty(false);
    private final SimpleBooleanProperty cameraOn = new SimpleBooleanProperty(true);
    private final SimpleObjectProperty<ConnectionQuality> quality =
            new SimpleObjectProperty<>(ConnectionQuality.HD);

    public Participant(String id, String displayName) {
        this.id = id;
        this.displayName = new SimpleStringProperty(displayName);
    }

    public String id() {
        return id;
    }

    public SimpleStringProperty displayNameProperty() {
        return displayName;
    }

    public SimpleBooleanProperty micMutedProperty() {
        return micMuted;
    }

    public SimpleBooleanProperty cameraOnProperty() {
        return cameraOn;
    }

    public SimpleObjectProperty<ConnectionQuality> qualityProperty() {
        return quality;
    }
}
