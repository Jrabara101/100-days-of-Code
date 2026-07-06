import javafx.application.Application;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Scene;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.ToggleButton;
import javafx.scene.layout.BorderPane;
import javafx.scene.layout.GridPane;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.RowConstraints;
import javafx.scene.layout.ColumnConstraints;
import javafx.scene.layout.StackPane;
import javafx.scene.layout.VBox;
import javafx.scene.paint.Color;
import javafx.scene.shape.Circle;
import javafx.stage.Stage;

/**
 * Video Conferencing App (Java + WebRTC) - project #67.
 *
 * The signaling/ICE/media-transport layer is simulated ({@link
 * SimulatedSignalingClient}) since real WebRTC media transport requires
 * native bindings (e.g. webrtc-java) not available in this environment.
 * What's real: the call state machine, retry/backoff policy, the
 * near-square participant grid layout algorithm, and the styled JavaFX
 * UI reacting live to state/quality changes via property bindings.
 */
public final class VideoConferenceApp extends Application {

    private final CallSession session = new CallSession(new SimulatedSignalingClient());
    private final GridPane participantGrid = new GridPane();
    private final Label statusLabel = new Label("Idle");
    private final Circle statusDot = new Circle(6);

    @Override
    public void start(Stage stage) {
        BorderPane root = new BorderPane();
        root.setStyle("-fx-background-color: #14161a;");

        root.setTop(buildStatusBar());
        root.setCenter(buildParticipantArea());
        root.setBottom(buildControlBar());

        session.stateProperty().addListener((obs, oldState, newState) -> refreshStatus(newState));
        session.participants().addListener((javafx.collections.ListChangeListener<Participant>) c -> rebuildGrid());

        Scene scene = new Scene(root, 960, 620);
        stage.setTitle("Video Conferencing - Room Demo");
        stage.setScene(scene);
        stage.show();

        session.join("standup-room");
    }

    private HBox buildStatusBar() {
        statusDot.setFill(Color.web("#888888"));
        statusLabel.setStyle("-fx-text-fill: #e6e6e6; -fx-font-size: 14px; -fx-font-weight: bold;");

        HBox bar = new HBox(10, statusDot, statusLabel);
        bar.setAlignment(Pos.CENTER_LEFT);
        bar.setPadding(new Insets(12, 16, 12, 16));
        bar.setStyle("-fx-background-color: #1d2025;");
        return bar;
    }

    private StackPane buildParticipantArea() {
        participantGrid.setHgap(10);
        participantGrid.setVgap(10);
        participantGrid.setPadding(new Insets(16));

        StackPane wrapper = new StackPane(participantGrid);
        wrapper.setStyle("-fx-background-color: #14161a;");
        return wrapper;
    }

    private HBox buildControlBar() {
        ToggleButton muteButton = new ToggleButton("Mute");
        ToggleButton cameraButton = new ToggleButton("Camera Off");
        Button leaveButton = new Button("Leave Call");

        String pillStyle = "-fx-background-radius: 20; -fx-padding: 8 20 8 20; -fx-font-size: 13px;";
        muteButton.setStyle(pillStyle + "-fx-background-color: #2c2f36; -fx-text-fill: #e6e6e6;");
        cameraButton.setStyle(pillStyle + "-fx-background-color: #2c2f36; -fx-text-fill: #e6e6e6;");
        leaveButton.setStyle(pillStyle + "-fx-background-color: #c0392b; -fx-text-fill: white;");

        leaveButton.setOnAction(e -> session.leave());

        HBox bar = new HBox(12, muteButton, cameraButton, leaveButton);
        bar.setAlignment(Pos.CENTER);
        bar.setPadding(new Insets(16));
        bar.setStyle("-fx-background-color: #1d2025;");
        return bar;
    }

    private void refreshStatus(CallState state) {
        String color;
        String text;
        switch (state) {
            case CONNECTED -> { color = "#2ecc71"; text = "Connected"; }
            case NEGOTIATING, DIALING -> { color = "#f39c12"; text = "Connecting..."; }
            case RECONNECTING -> { color = "#f39c12"; text = "Reconnecting..."; }
            case FAILED -> { color = "#e74c3c"; text = "Call failed: " + session.lastError(); }
            case ENDED -> { color = "#888888"; text = "Call ended"; }
            default -> { color = "#888888"; text = "Idle"; }
        }
        statusDot.setFill(Color.web(color));
        statusLabel.setText(text);
    }

    /**
     * Rebuilds the tile grid using {@link GridLayoutStrategy} so the
     * layout stays near-square regardless of how many participants
     * joined - the same reasoning a production conferencing UI applies.
     */
    private void rebuildGrid() {
        participantGrid.getChildren().clear();
        participantGrid.getColumnConstraints().clear();
        participantGrid.getRowConstraints().clear();

        var dims = GridLayoutStrategy.compute(session.participants().size());
        for (int c = 0; c < dims.columns(); c++) {
            ColumnConstraints cc = new ColumnConstraints();
            cc.setPercentWidth(100.0 / dims.columns());
            participantGrid.getColumnConstraints().add(cc);
        }
        for (int r = 0; r < dims.rows(); r++) {
            RowConstraints rc = new RowConstraints();
            rc.setPercentHeight(100.0 / dims.rows());
            participantGrid.getRowConstraints().add(rc);
        }

        int index = 0;
        for (Participant p : session.participants()) {
            participantGrid.add(buildTile(p), index % dims.columns(), index / dims.columns());
            index++;
        }
    }

    private VBox buildTile(Participant p) {
        Label nameLabel = new Label(p.displayNameProperty().get());
        nameLabel.setStyle("-fx-text-fill: white; -fx-font-size: 13px;");

        Label qualityLabel = new Label(p.qualityProperty().get().label());
        qualityLabel.setStyle("-fx-text-fill: #9aa0a6; -fx-font-size: 11px;");
        p.qualityProperty().addListener((obs, oldQ, newQ) -> qualityLabel.setText(newQ.label()));

        VBox tile = new VBox(4, nameLabel, qualityLabel);
        tile.setAlignment(Pos.BOTTOM_LEFT);
        tile.setPadding(new Insets(10));
        tile.setStyle("-fx-background-color: #23262b; -fx-background-radius: 8;");
        VBox.setVgrow(tile, Priority.ALWAYS);
        return tile;
    }

    public static void main(String[] args) {
        launch(args);
    }
}
