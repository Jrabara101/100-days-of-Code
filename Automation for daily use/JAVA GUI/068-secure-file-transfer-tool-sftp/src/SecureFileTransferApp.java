import javafx.application.Application;
import javafx.beans.binding.Bindings;
import javafx.collections.ListChangeListener;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.control.cell.ProgressBarTableCell;
import javafx.scene.layout.*;
import javafx.scene.paint.Color;
import javafx.scene.shape.Circle;
import javafx.stage.FileChooser;
import javafx.stage.Stage;
import java.io.File;
import java.util.List;

public class SecureFileTransferApp extends Application {

    // ---- colour palette (dark teal/charcoal security-tool aesthetic) ----
    private static final String BG_DARK    = "#1a1e24";
    private static final String BG_PANEL   = "#22282f";
    private static final String BG_INPUT   = "#2b3240";
    private static final String ACCENT     = "#00c8a0";   // teal
    private static final String ACCENT2    = "#4a9eff";   // blue for upload badge
    private static final String TEXT_MAIN  = "#e2e8f0";
    private static final String TEXT_MUTED = "#8899a6";
    private static final String RED        = "#e05c5c";
    private static final String GREEN      = "#38c172";
    private static final String YELLOW     = "#f0c040";

    private TransferSession session;
    private Thread sessionThread;

    // connection form fields
    private TextField hostField;
    private TextField portField;
    private TextField userField;
    private PasswordField passField;
    private TextField remotePathField;
    private TextField fingerprintField;
    private ComboBox<ChecksumAlgorithm> algoCombo;

    // status widgets
    private Label statusLabel;
    private Circle statusDot;
    private ProgressBar overallBar;

    // file queue table
    private TableView<FileEntry> fileTable;

    @Override
    public void start(Stage stage) {
        BorderPane root = new BorderPane();
        root.setStyle("-fx-background-color: " + BG_DARK + ";");

        root.setTop(buildHeader());
        root.setLeft(buildConnectionPanel());
        root.setCenter(buildQueuePanel());
        root.setBottom(buildStatusBar());

        Scene scene = new Scene(root, 1000, 680);
        stage.setTitle("Secure File Transfer Tool — SFTP");
        stage.setScene(scene);
        stage.show();
    }

    // ---- header ----
    private HBox buildHeader() {
        Label title = new Label("Secure File Transfer");
        title.setStyle("-fx-font-size: 18px; -fx-font-weight: bold; -fx-text-fill: " + ACCENT + ";");

        Label subtitle = new Label("SSH File Transfer Protocol  •  End-to-end integrity verification");
        subtitle.setStyle("-fx-font-size: 11px; -fx-text-fill: " + TEXT_MUTED + ";");

        VBox titleBox = new VBox(2, title, subtitle);
        HBox header = new HBox(titleBox);
        header.setPadding(new Insets(16, 20, 12, 20));
        header.setStyle("-fx-background-color: " + BG_PANEL + ";" +
                        "-fx-border-color: #2e3a47; -fx-border-width: 0 0 1 0;");
        return header;
    }

    // ---- left: connection profile panel ----
    private VBox buildConnectionPanel() {
        VBox panel = new VBox(10);
        panel.setPadding(new Insets(16));
        panel.setPrefWidth(280);
        panel.setStyle("-fx-background-color: " + BG_PANEL + ";" +
                       "-fx-border-color: #2e3a47; -fx-border-width: 0 1 0 0;");

        Label heading = label("CONNECTION PROFILE", 11, TEXT_MUTED, true);

        hostField      = styledTextField("Hostname / IP");
        portField      = styledTextField("22");
        userField      = styledTextField("Username");
        passField      = new PasswordField();
        styleTextField(passField, "Password");
        remotePathField = styledTextField("/home/user/uploads");
        fingerprintField = styledTextField("Optional: SHA256:abc...");

        algoCombo = new ComboBox<>();
        algoCombo.getItems().addAll(ChecksumAlgorithm.values());
        algoCombo.setValue(ChecksumAlgorithm.SHA256);
        algoCombo.setStyle(inputStyle());
        algoCombo.setMaxWidth(Double.MAX_VALUE);
        algoCombo.setPromptText("Integrity algorithm");

        Button connectBtn = styledButton("Connect & Transfer", ACCENT, BG_DARK);
        connectBtn.setMaxWidth(Double.MAX_VALUE);
        connectBtn.setOnAction(e -> startTransfer());

        Button cancelBtn = styledButton("Cancel", RED, BG_DARK);
        cancelBtn.setMaxWidth(Double.MAX_VALUE);
        cancelBtn.setOnAction(e -> cancelTransfer());

        Button addFilesBtn = styledButton("+ Add Files to Queue", ACCENT2, BG_DARK);
        addFilesBtn.setMaxWidth(Double.MAX_VALUE);
        addFilesBtn.setOnAction(e -> addFilesToQueue());

        panel.getChildren().addAll(
            heading,
            fieldGroup("Host", hostField),
            fieldGroup("Port", portField),
            fieldGroup("Username", userField),
            fieldGroup("Password", passField),
            fieldGroup("Remote Path", remotePathField),
            fieldGroup("Host Key (fingerprint)", fingerprintField),
            fieldGroup("Integrity Algorithm", algoCombo),
            new Separator(),
            addFilesBtn,
            connectBtn,
            cancelBtn
        );

        // Populate with demo defaults so the UI looks usable on first launch
        hostField.setText("demo.sftp.example.com");
        portField.setText("22");
        userField.setText("demouser");
        remotePathField.setText("/uploads");

        return panel;
    }

    // ---- center: file queue panel ----
    @SuppressWarnings("unchecked")
    private VBox buildQueuePanel() {
        fileTable = new TableView<>();
        fileTable.setStyle("-fx-background-color: " + BG_DARK + ";" +
                           "-fx-control-inner-background: " + BG_DARK + ";" +
                           "-fx-table-cell-border-color: #2e3a47;");
        fileTable.setPlaceholder(new Label("No files in queue — click '+ Add Files to Queue'"));
        fileTable.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY_ALL_COLUMNS);

        TableColumn<FileEntry, String> nameCol = new TableColumn<>("File");
        nameCol.setCellValueFactory(c -> c.getValue().nameProperty());
        nameCol.setPrefWidth(230);

        TableColumn<FileEntry, String> sizeCol = new TableColumn<>("Size");
        sizeCol.setCellValueFactory(c ->
            Bindings.createStringBinding(() -> c.getValue().formattedSize()));
        sizeCol.setPrefWidth(80);

        TableColumn<FileEntry, FileEntry.Direction> dirCol = new TableColumn<>("Dir");
        dirCol.setCellValueFactory(c -> c.getValue().directionProperty());
        dirCol.setCellFactory(col -> new TableCell<>() {
            @Override protected void updateItem(FileEntry.Direction dir, boolean empty) {
                super.updateItem(dir, empty);
                if (empty || dir == null) { setText(null); setStyle(""); return; }
                setText(dir == FileEntry.Direction.UPLOAD ? "↑ UP" : "↓ DN");
                setStyle("-fx-text-fill: " + (dir == FileEntry.Direction.UPLOAD ? ACCENT2 : ACCENT) +
                         "; -fx-font-weight: bold; -fx-font-size: 11px;");
            }
        });
        dirCol.setPrefWidth(55);

        TableColumn<FileEntry, Double> progCol = new TableColumn<>("Progress");
        progCol.setCellValueFactory(c -> c.getValue().progressProperty().asObject());
        progCol.setCellFactory(ProgressBarTableCell.forTableColumn());
        progCol.setPrefWidth(130);

        TableColumn<FileEntry, TransferState> stateCol = new TableColumn<>("Status");
        stateCol.setCellValueFactory(c -> c.getValue().stateProperty());
        stateCol.setCellFactory(col -> new TableCell<>() {
            @Override protected void updateItem(TransferState s, boolean empty) {
                super.updateItem(s, empty);
                if (empty || s == null) { setText(null); setStyle(""); return; }
                String color = stateColor(s);
                setText(s.toString());
                setStyle("-fx-text-fill: " + color + "; -fx-font-size: 11px;");
            }
        });
        stateCol.setPrefWidth(100);

        TableColumn<FileEntry, String> csCol = new TableColumn<>("Checksum");
        csCol.setCellValueFactory(c -> c.getValue().checksumProperty());
        csCol.setCellFactory(col -> new TableCell<>() {
            @Override protected void updateItem(String cs, boolean empty) {
                super.updateItem(cs, empty);
                if (empty || cs == null || cs.isBlank()) { setText(null); return; }
                // Show only first 12 chars + ellipsis — full value in tooltip
                String display = cs.length() > 12 ? cs.substring(0, 12) + "…" : cs;
                setText(display);
                setTooltip(new Tooltip(cs));
                setStyle("-fx-font-family: monospace; -fx-font-size: 10px; -fx-text-fill: " + ACCENT + ";");
            }
        });
        csCol.setPrefWidth(110);

        fileTable.getColumns().addAll(nameCol, dirCol, sizeCol, progCol, stateCol, csCol);

        overallBar = new ProgressBar(0.0);
        overallBar.setMaxWidth(Double.MAX_VALUE);
        overallBar.setPrefHeight(6);
        overallBar.setStyle("-fx-accent: " + ACCENT + "; -fx-background-color: #2e3a47;");

        Label queueLabel = label("TRANSFER QUEUE", 11, TEXT_MUTED, true);

        VBox panel = new VBox(8, queueLabel, fileTable, overallBar);
        VBox.setVgrow(fileTable, Priority.ALWAYS);
        panel.setPadding(new Insets(16));
        panel.setStyle("-fx-background-color: " + BG_DARK + ";");

        return panel;
    }

    // ---- bottom: status bar ----
    private HBox buildStatusBar() {
        statusDot = new Circle(5);
        statusDot.setFill(Color.web(TEXT_MUTED));

        statusLabel = new Label("Ready");
        statusLabel.setStyle("-fx-text-fill: " + TEXT_MAIN + "; -fx-font-size: 12px;");

        HBox bar = new HBox(8, statusDot, statusLabel);
        bar.setAlignment(Pos.CENTER_LEFT);
        bar.setPadding(new Insets(8, 16, 8, 16));
        bar.setStyle("-fx-background-color: " + BG_PANEL + ";" +
                     "-fx-border-color: #2e3a47; -fx-border-width: 1 0 0 0;");
        return bar;
    }

    // ---- actions ----
    private void addFilesToQueue() {
        FileChooser fc = new FileChooser();
        fc.setTitle("Select files to upload");
        List<File> files = fc.showOpenMultipleDialog(null);
        if (files == null) return;
        for (File f : files) {
            fileTable.getItems().add(
                new FileEntry(f.getName(), f.length(), FileEntry.Direction.UPLOAD));
        }
    }

    private void startTransfer() {
        if (fileTable.getItems().isEmpty()) {
            showAlert("No files in queue. Add files before connecting.");
            return;
        }

        ConnectionProfile profile = buildProfile();
        if (profile == null) return;

        ChecksumAlgorithm algo = algoCombo.getValue();
        session = new TransferSession(new SimulatedSftpClient(), algo);

        // Wire observable state to UI
        session.sessionStateProperty().addListener((obs, old, s) -> updateStatusIndicator(s));
        session.statusMessageProperty().addListener((obs, old, msg) -> statusLabel.setText(msg));
        session.overallProgressProperty().addListener((obs, old, p) -> overallBar.setProgress(p.doubleValue()));

        for (FileEntry e : fileTable.getItems()) {
            session.addFile(e);
        }

        sessionThread = new Thread(() -> session.run(profile), "sftp-session");
        sessionThread.setDaemon(true);
        sessionThread.start();
    }

    private void cancelTransfer() {
        if (session != null) session.cancel();
    }

    private ConnectionProfile buildProfile() {
        String host = hostField.getText().trim();
        String user = userField.getText().trim();
        if (host.isEmpty() || user.isEmpty()) {
            showAlert("Host and Username are required.");
            return null;
        }
        int port;
        try {
            port = Integer.parseInt(portField.getText().trim());
            if (port < 1 || port > 65535) throw new NumberFormatException();
        } catch (NumberFormatException e) {
            showAlert("Port must be a number between 1 and 65535.");
            return null;
        }
        return new ConnectionProfile(
            host, port, user,
            passField.getText(),
            remotePathField.getText().trim(),
            fingerprintField.getText().trim()
        );
    }

    // ---- status indicator color logic ----
    private void updateStatusIndicator(TransferState state) {
        statusDot.setFill(Color.web(stateColor(state)));
    }

    private String stateColor(TransferState state) {
        return switch (state) {
            case COMPLETE     -> GREEN;
            case FAILED       -> RED;
            case CANCELLED    -> YELLOW;
            case TRANSFERRING,
                 CONNECTING,
                 AUTHENTICATING,
                 VERIFYING    -> ACCENT;
            default           -> TEXT_MUTED;
        };
    }

    // ---- style helpers ----
    private Label label(String text, int size, String color, boolean upper) {
        Label l = new Label(upper ? text.toUpperCase() : text);
        l.setStyle("-fx-font-size: " + size + "px; -fx-text-fill: " + color + ";" +
                   (upper ? " -fx-letter-spacing: 1px;" : ""));
        return l;
    }

    private TextField styledTextField(String prompt) {
        TextField f = new TextField();
        styleTextField(f, prompt);
        return f;
    }

    private void styleTextField(TextField f, String prompt) {
        f.setPromptText(prompt);
        f.setStyle(inputStyle());
    }

    private String inputStyle() {
        return "-fx-background-color: " + BG_INPUT + ";" +
               "-fx-text-fill: " + TEXT_MAIN + ";" +
               "-fx-prompt-text-fill: " + TEXT_MUTED + ";" +
               "-fx-border-color: #3a4a5a; -fx-border-radius: 4; -fx-background-radius: 4;" +
               "-fx-padding: 5 8 5 8;";
    }

    private Button styledButton(String text, String fg, String bg) {
        Button b = new Button(text);
        b.setStyle("-fx-background-color: " + fg + "20;" +
                   "-fx-text-fill: " + fg + ";" +
                   "-fx-border-color: " + fg + ";" +
                   "-fx-border-radius: 4; -fx-background-radius: 4;" +
                   "-fx-padding: 7 14 7 14; -fx-font-size: 12px;");
        b.setOnMouseEntered(e ->
            b.setStyle("-fx-background-color: " + fg + ";" +
                       "-fx-text-fill: " + bg + ";" +
                       "-fx-border-color: " + fg + ";" +
                       "-fx-border-radius: 4; -fx-background-radius: 4;" +
                       "-fx-padding: 7 14 7 14; -fx-font-size: 12px;"));
        b.setOnMouseExited(e ->
            b.setStyle("-fx-background-color: " + fg + "20;" +
                       "-fx-text-fill: " + fg + ";" +
                       "-fx-border-color: " + fg + ";" +
                       "-fx-border-radius: 4; -fx-background-radius: 4;" +
                       "-fx-padding: 7 14 7 14; -fx-font-size: 12px;"));
        return b;
    }

    private VBox fieldGroup(String labelText, javafx.scene.Node field) {
        Label lbl = new Label(labelText);
        lbl.setStyle("-fx-font-size: 10px; -fx-text-fill: " + TEXT_MUTED + ";");
        VBox g = new VBox(2, lbl, field);
        return g;
    }

    private void showAlert(String msg) {
        Alert a = new Alert(Alert.AlertType.WARNING, msg, ButtonType.OK);
        a.setHeaderText(null);
        a.showAndWait();
    }

    public static void main(String[] args) {
        launch(args);
    }
}
