import javafx.animation.Animation;
import javafx.animation.KeyFrame;
import javafx.animation.Timeline;
import javafx.application.Application;
import javafx.application.Platform;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Scene;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.PasswordField;
import javafx.scene.control.TextField;
import javafx.scene.control.Tooltip;
import javafx.scene.layout.BorderPane;
import javafx.scene.layout.ColumnConstraints;
import javafx.scene.layout.GridPane;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.RowConstraints;
import javafx.scene.layout.StackPane;
import javafx.scene.layout.VBox;
import javafx.scene.paint.Color;
import javafx.scene.shape.Circle;
import javafx.stage.Stage;
import javafx.util.Duration;

/**
 * Remote Desktop Controller (Java RMI) — project #69.
 *
 * The RMI transport and remote framebuffer are simulated ({@link SimulatedRmiTransport})
 * since a live rmiregistry and remote host aren't present. What's real:
 * the session state machine, the transient-vs-terminal authentication distinction,
 * the delta-vs-full-refresh encoding decision ({@link FrameEncodingStrategy}),
 * the single-queue input event ordering guarantee ({@link RemoteSession}), and the
 * styled JavaFX UI reacting live to observable framebuffer and session state changes.
 */
public final class RemoteDesktopApp extends Application {

    // 4 columns × 3 rows of simulated screen regions
    private static final int GRID_COLS = 4;
    private static final int GRID_ROWS = 3;

    private final RemoteSession session = new RemoteSession(new SimulatedRmiTransport());
    private final GridPane regionGrid = new GridPane();
    private final Label statusLabel = new Label("Disconnected");
    private final Circle statusDot = new Circle(7);
    private final Label latencyLabel = new Label("-- ms");
    private Timeline framePump;

    // Connection fields
    private TextField hostField;
    private TextField portField;
    private TextField userField;
    private PasswordField passField;

    @Override
    public void start(Stage stage) {
        BorderPane root = new BorderPane();
        root.setStyle("-fx-background-color: #0d0f14;");

        root.setTop(buildTopBar());
        root.setCenter(buildDesktopView());
        root.setBottom(buildInputBar());

        // Wire session state → status bar
        session.stateProperty().addListener((obs, oldState, newState) ->
                Platform.runLater(() -> refreshStatus(newState)));

        session.latencyLabelProperty().addListener((obs, oldVal, newVal) ->
                Platform.runLater(() -> latencyLabel.setText(newVal)));

        // Wire region dirty state → tile visual updates
        for (ScreenRegion region : session.regions()) {
            region.encodedPayloadProperty().addListener((obs, oldVal, newVal) ->
                    Platform.runLater(() -> updateRegionTile(region)));
            region.dirtyProperty().addListener((obs, oldVal, newVal) ->
                    Platform.runLater(() -> updateRegionTile(region)));
        }

        buildRegionGrid();

        Scene scene = new Scene(root, 1050, 680);
        stage.setTitle("Remote Desktop Controller — RMI");
        stage.setScene(scene);
        stage.show();
    }

    // --- Top bar: status dot + session info + latency -----------------------

    private HBox buildTopBar() {
        statusDot.setFill(Color.web("#555555"));
        statusLabel.setStyle("-fx-text-fill: #dde1e7; -fx-font-size: 14px; -fx-font-weight: bold;");

        latencyLabel.setStyle("-fx-text-fill: #7a8494; -fx-font-size: 12px;");

        Label title = new Label("Remote Desktop Controller");
        title.setStyle("-fx-text-fill: #aab4c4; -fx-font-size: 13px;");

        HBox left = new HBox(10, statusDot, statusLabel);
        left.setAlignment(Pos.CENTER_LEFT);

        HBox right = new HBox(10, new Label("RTT:") {{
            setStyle("-fx-text-fill: #7a8494; -fx-font-size: 12px;");
        }}, latencyLabel);
        right.setAlignment(Pos.CENTER_RIGHT);
        HBox.setHgrow(right, Priority.ALWAYS);

        HBox bar = new HBox(16, left, right);
        bar.setAlignment(Pos.CENTER_LEFT);
        bar.setPadding(new Insets(12, 18, 12, 18));
        bar.setStyle("-fx-background-color: #161920; -fx-border-color: #272c38; -fx-border-width: 0 0 1 0;");
        return bar;
    }

    // --- Center: simulated framebuffer grid ---------------------------------

    private BorderPane buildDesktopView() {
        regionGrid.setHgap(4);
        regionGrid.setVgap(4);
        regionGrid.setPadding(new Insets(14));

        for (int c = 0; c < GRID_COLS; c++) {
            ColumnConstraints cc = new ColumnConstraints();
            cc.setPercentWidth(100.0 / GRID_COLS);
            regionGrid.getColumnConstraints().add(cc);
        }
        for (int r = 0; r < GRID_ROWS; r++) {
            RowConstraints rc = new RowConstraints();
            rc.setPercentHeight(100.0 / GRID_ROWS);
            regionGrid.getRowConstraints().add(rc);
        }

        Label hint = new Label("Framebuffer — connect to a host to stream regions");
        hint.setStyle("-fx-text-fill: #454d5e; -fx-font-size: 13px;");

        StackPane wrapper = new StackPane(regionGrid, hint);
        hint.setMouseTransparent(true);
        StackPane.setAlignment(hint, Pos.CENTER);

        session.stateProperty().addListener((obs, oldS, newS) ->
                Platform.runLater(() -> hint.setVisible(newS != SessionState.ACTIVE)));

        BorderPane pane = new BorderPane();
        pane.setCenter(wrapper);
        pane.setStyle("-fx-background-color: #0d0f14;");
        return pane;
    }

    private void buildRegionGrid() {
        for (ScreenRegion region : session.regions()) {
            regionGrid.add(buildRegionTile(region), region.col(), region.row());
        }
    }

    private StackPane buildRegionTile(ScreenRegion region) {
        Label coordLabel = new Label(region.col() + "×" + region.row());
        coordLabel.setStyle("-fx-text-fill: #3d4455; -fx-font-size: 10px;");

        Label payloadLabel = new Label(region.encodedPayloadProperty().get());
        payloadLabel.setStyle("-fx-text-fill: #8898b0; -fx-font-size: 11px;");
        payloadLabel.setWrapText(true);

        VBox content = new VBox(4, coordLabel, payloadLabel);
        content.setAlignment(Pos.TOP_LEFT);
        content.setPadding(new Insets(8));

        StackPane tile = new StackPane(content);
        tile.setStyle("-fx-background-color: #1a1f2b; -fx-background-radius: 5;");
        tile.setMinHeight(100);
        tile.setUserData(new Object[]{payloadLabel, tile});

        Tooltip.install(tile, new Tooltip("Region [" + region.col() + ", " + region.row() + "]"));

        // Click on tile → enqueue a simulated mouse click to that region
        tile.setOnMouseClicked(e -> {
            InputEvent ev = new InputEvent(InputEvent.Kind.MOUSE_CLICK,
                    "click @ region [" + region.col() + "," + region.row() + "]");
            session.enqueueInput(ev);
        });

        return tile;
    }

    /** Refreshes a tile's visual state when the region's payload or dirty flag changes. */
    @SuppressWarnings("unchecked")
    private void updateRegionTile(ScreenRegion region) {
        // Find the tile at (col, row) in the grid
        for (javafx.scene.Node node : regionGrid.getChildren()) {
            Integer c = GridPane.getColumnIndex(node);
            Integer r = GridPane.getRowIndex(node);
            if (c != null && r != null && c == region.col() && r == region.row()) {
                if (node instanceof StackPane tile) {
                    Object[] data = (Object[]) tile.getUserData();
                    if (data != null && data[0] instanceof Label lbl) {
                        lbl.setText(region.encodedPayloadProperty().get());
                    }
                    // Highlight dirty tiles in a saturated teal; idle tiles revert to dark slate
                    String bg = region.dirtyProperty().get()
                            ? "-fx-background-color: #0f3040; -fx-background-radius: 5;"
                            : "-fx-background-color: #1a1f2b; -fx-background-radius: 5;";
                    tile.setStyle(bg);
                }
                break;
            }
        }
    }

    // --- Bottom bar: connection form + controls -----------------------------

    private VBox buildInputBar() {
        hostField = new TextField("localhost");
        portField = new TextField("1099");
        userField = new TextField("admin");
        passField = new PasswordField();
        passField.setText("secret");

        styleField(hostField, "Host");
        styleField(portField, "Port");
        styleField(userField, "Username");
        styleField(passField, "Password");

        Button connectBtn = new Button("Connect");
        Button disconnectBtn = new Button("Disconnect");
        Button keyPressBtn = new Button("Send Key");

        connectBtn.setStyle("-fx-background-color: #1a6b3c; -fx-text-fill: white; "
                + "-fx-background-radius: 6; -fx-padding: 7 18 7 18; -fx-font-size: 13px;");
        disconnectBtn.setStyle("-fx-background-color: #7a1c1c; -fx-text-fill: white; "
                + "-fx-background-radius: 6; -fx-padding: 7 18 7 18; -fx-font-size: 13px;");
        keyPressBtn.setStyle("-fx-background-color: #2c3a52; -fx-text-fill: #c8d6e5; "
                + "-fx-background-radius: 6; -fx-padding: 7 18 7 18; -fx-font-size: 13px;");

        connectBtn.setOnAction(e -> {
            String host = hostField.getText().trim();
            int port;
            try {
                port = Integer.parseInt(portField.getText().trim());
            } catch (NumberFormatException ex) {
                port = 1099;
            }
            String user = userField.getText().trim();
            String pass = passField.getText();

            final String h = host;
            final int p = port;
            final String u = user;
            final String pw = pass;

            // Connect on a background thread — RMI calls block
            Thread t = new Thread(() -> session.connect(h, p, u, pw), "rmi-connect");
            t.setDaemon(true);
            t.start();

            // Once ACTIVE, start the frame pump
            session.stateProperty().addListener((obs, oldS, newS) -> {
                if (newS == SessionState.ACTIVE) {
                    Platform.runLater(this::startFramePump);
                } else if (newS == SessionState.IDLE || newS == SessionState.FAILED) {
                    Platform.runLater(this::stopFramePump);
                }
            });
        });

        disconnectBtn.setOnAction(e -> {
            stopFramePump();
            Thread t = new Thread(session::disconnect, "rmi-disconnect");
            t.setDaemon(true);
            t.start();
        });

        keyPressBtn.setOnAction(e -> {
            InputEvent ev = new InputEvent(InputEvent.Kind.KEY_PRESS, "Ctrl+C");
            session.enqueueInput(ev);
        });

        HBox fields = new HBox(10, label("Host:"), hostField, label("Port:"), portField,
                label("User:"), userField, label("Pass:"), passField);
        fields.setAlignment(Pos.CENTER_LEFT);

        HBox buttons = new HBox(10, connectBtn, disconnectBtn, keyPressBtn);
        buttons.setAlignment(Pos.CENTER_LEFT);

        VBox bar = new VBox(8, fields, buttons);
        bar.setPadding(new Insets(14, 18, 14, 18));
        bar.setStyle("-fx-background-color: #161920; -fx-border-color: #272c38; -fx-border-width: 1 0 0 0;");
        return bar;
    }

    private Label label(String text) {
        Label l = new Label(text);
        l.setStyle("-fx-text-fill: #7a8494; -fx-font-size: 12px;");
        return l;
    }

    private void styleField(javafx.scene.control.TextInputControl field, String prompt) {
        field.setPromptText(prompt);
        field.setStyle("-fx-background-color: #222736; -fx-text-fill: #d8e0eb; "
                + "-fx-prompt-text-fill: #454d5e; -fx-background-radius: 5; "
                + "-fx-border-color: #2e3548; -fx-border-radius: 5; -fx-padding: 5 10 5 10;");
        field.setPrefWidth(120);
    }

    // --- Frame pump ----------------------------------------------------------

    private void startFramePump() {
        if (framePump != null && framePump.getStatus() == Animation.Status.RUNNING) return;
        framePump = new Timeline(new KeyFrame(Duration.millis(250), e -> {
            // Run tick off the FX thread so RMI calls don't freeze the UI
            Thread t = new Thread(session::tick, "rmi-frame-pump");
            t.setDaemon(true);
            t.start();
        }));
        framePump.setCycleCount(Timeline.INDEFINITE);
        framePump.play();
    }

    private void stopFramePump() {
        if (framePump != null) {
            framePump.stop();
        }
    }

    // --- Status bar refresh --------------------------------------------------

    private void refreshStatus(SessionState s) {
        String color;
        String text;
        switch (s) {
            case ACTIVE         -> { color = "#2ecc71"; text = "Connected — streaming"; }
            case CONNECTING     -> { color = "#f0a500"; text = "Connecting..."; }
            case AUTHENTICATING -> { color = "#f0a500"; text = "Authenticating..."; }
            case RECONNECTING   -> { color = "#e67e22"; text = "Reconnecting..."; }
            case DISCONNECTING  -> { color = "#7a8494"; text = "Disconnecting..."; }
            case FAILED         -> { color = "#e74c3c"; text = "Failed: " + session.lastErrorProperty().get(); }
            default             -> { color = "#555555"; text = "Disconnected"; }
        }
        statusDot.setFill(Color.web(color));
        statusLabel.setText(text);
    }

    public static void main(String[] args) {
        launch(args);
    }
}
