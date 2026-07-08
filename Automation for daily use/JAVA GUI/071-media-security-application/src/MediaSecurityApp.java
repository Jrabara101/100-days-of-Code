import javafx.application.Application;
import javafx.application.Platform;
import javafx.beans.binding.Bindings;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.concurrent.Task;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.control.cell.PropertyValueFactory;
import javafx.scene.layout.*;
import javafx.scene.paint.Color;
import javafx.scene.text.Font;
import javafx.scene.text.FontWeight;
import javafx.stage.FileChooser;
import javafx.stage.Stage;

import javax.crypto.SecretKey;
import java.io.File;
import java.util.Arrays;

/**
 * Main JavaFX Application for Media Security.
 *
 * Layout regions:
 * - Top bar: app title + mode toggle (Encrypt / Decrypt)
 * - Center: split between left (file drop/selection + password) and
 *           right (operation log table with integrity records)
 * - Bottom: status bar bound to the most recent operation result
 *
 * Design choices:
 * - Salt is stored as the first 16 bytes of the output .msec file so the
 *   user never has to manage it separately — the UI only needs one password.
 * - The PasswordField input is cleared immediately after key derivation to
 *   minimize the window in which the password sits in heap memory.
 * - Crypto runs on a background Task so the JavaFX Application Thread stays
 *   responsive and the progress spinner can animate during large files.
 */
public class MediaSecurityApp extends Application {

    // Dark theme colors
    private static final String BG_DARK     = "#1a1a2e";
    private static final String BG_PANEL    = "#16213e";
    private static final String BG_CARD     = "#0f3460";
    private static final String ACCENT_CYAN = "#00d4ff";
    private static final String ACCENT_GREEN= "#00ff88";
    private static final String ACCENT_RED  = "#ff4757";
    private static final String TEXT_WHITE  = "#e0e0e0";
    private static final String TEXT_DIM    = "#7f8c8d";

    private final MediaCryptoEngine engine = new MediaCryptoEngine();
    private final ObservableList<OperationRow> opLog = FXCollections.observableArrayList();

    private Label selectedFileLabel;
    private PasswordField passwordField;
    private Label statusLabel;
    private ProgressIndicator spinner;
    private ToggleGroup modeGroup;
    private File selectedFile;

    @Override
    public void start(Stage stage) {
        stage.setTitle("Media Security Application");

        BorderPane root = new BorderPane();
        root.setStyle("-fx-background-color: " + BG_DARK + ";");

        root.setTop(buildTopBar());
        root.setCenter(buildCenter(stage));
        root.setBottom(buildStatusBar());

        Scene scene = new Scene(root, 1000, 680);
        stage.setScene(scene);
        stage.show();
    }

    // ── Top bar ─────────────────────────────────────────────────────────────

    private HBox buildTopBar() {
        Label title = new Label("Media Security Application");
        title.setFont(Font.font("Segoe UI", FontWeight.BOLD, 20));
        title.setStyle("-fx-text-fill: " + ACCENT_CYAN + ";");

        Label subtitle = new Label("AES-256 · HMAC-SHA256 · Magic-byte media detection");
        subtitle.setFont(Font.font("Segoe UI", 12));
        subtitle.setStyle("-fx-text-fill: " + TEXT_DIM + ";");

        VBox titleBox = new VBox(2, title, subtitle);

        ToggleButton encBtn = new ToggleButton("Encrypt");
        ToggleButton decBtn = new ToggleButton("Decrypt");
        modeGroup = new ToggleGroup();
        encBtn.setToggleGroup(modeGroup);
        decBtn.setToggleGroup(modeGroup);
        encBtn.setSelected(true);

        String toggleBase = "-fx-cursor: hand; -fx-border-radius: 4; -fx-background-radius: 4; " +
                "-fx-font-size: 13px; -fx-font-weight: bold; -fx-padding: 6 18;";
        encBtn.setStyle(toggleBase + "-fx-background-color: " + ACCENT_CYAN + "; -fx-text-fill: " + BG_DARK + ";");
        decBtn.setStyle(toggleBase + "-fx-background-color: " + BG_CARD + "; -fx-text-fill: " + TEXT_WHITE + ";");

        encBtn.selectedProperty().addListener((ob, ov, selected) -> {
            if (selected) {
                encBtn.setStyle(toggleBase + "-fx-background-color: " + ACCENT_CYAN + "; -fx-text-fill: " + BG_DARK + ";");
                decBtn.setStyle(toggleBase + "-fx-background-color: " + BG_CARD + "; -fx-text-fill: " + TEXT_WHITE + ";");
            } else {
                encBtn.setStyle(toggleBase + "-fx-background-color: " + BG_CARD + "; -fx-text-fill: " + TEXT_WHITE + ";");
                decBtn.setStyle(toggleBase + "-fx-background-color: " + ACCENT_CYAN + "; -fx-text-fill: " + BG_DARK + ";");
            }
        });

        HBox modeBox = new HBox(0, encBtn, decBtn);
        modeBox.setAlignment(Pos.CENTER_RIGHT);

        HBox bar = new HBox(titleBox, new Pane(), modeBox);
        HBox.setHgrow(bar.getChildren().get(1), Priority.ALWAYS);
        bar.setAlignment(Pos.CENTER_LEFT);
        bar.setPadding(new Insets(14, 20, 14, 20));
        bar.setStyle("-fx-background-color: " + BG_PANEL + "; -fx-border-color: " + BG_CARD + "; " +
                "-fx-border-width: 0 0 1 0;");
        return bar;
    }

    // ── Center ───────────────────────────────────────────────────────────────

    private SplitPane buildCenter(Stage stage) {
        SplitPane split = new SplitPane(buildLeftPanel(stage), buildRightPanel());
        split.setDividerPositions(0.38);
        SplitPane.setResizableWithParent(split.getItems().get(0), Boolean.FALSE);
        return split;
    }

    private VBox buildLeftPanel(Stage stage) {
        Label sectionLabel = styledSectionLabel("FILE & KEY");

        // File selection
        selectedFileLabel = new Label("No file selected");
        selectedFileLabel.setWrapText(true);
        selectedFileLabel.setStyle("-fx-text-fill: " + TEXT_DIM + "; -fx-font-size: 12px;");

        Button browseBtn = actionButton("Browse File", ACCENT_CYAN);
        browseBtn.setMaxWidth(Double.MAX_VALUE);
        browseBtn.setOnAction(e -> {
            FileChooser chooser = new FileChooser();
            chooser.setTitle("Select Media File");
            chooser.getExtensionFilters().addAll(
                new FileChooser.ExtensionFilter("Media Files",
                    "*.jpg","*.jpeg","*.png","*.gif","*.bmp","*.webp",
                    "*.mp3","*.ogg","*.flac","*.wav",
                    "*.mp4","*.avi","*.mkv",
                    "*.msec"),
                new FileChooser.ExtensionFilter("All Files", "*.*")
            );
            File f = chooser.showOpenDialog(stage);
            if (f != null) {
                selectedFile = f;
                selectedFileLabel.setText(f.getName());
                selectedFileLabel.setStyle("-fx-text-fill: " + TEXT_WHITE + "; -fx-font-size: 12px;");
            }
        });

        VBox fileCard = card("Input File", selectedFileLabel, browseBtn);

        // Password
        passwordField = new PasswordField();
        passwordField.setPromptText("Enter encryption password...");
        passwordField.setStyle("-fx-background-color: " + BG_DARK + "; -fx-text-fill: " + TEXT_WHITE + "; " +
                "-fx-border-color: " + BG_CARD + "; -fx-border-radius: 4; -fx-background-radius: 4; " +
                "-fx-prompt-text-fill: " + TEXT_DIM + "; -fx-padding: 8;");

        Label pwNote = new Label("Passwords are cleared from memory immediately after key derivation (PBKDF2, 310k rounds).");
        pwNote.setWrapText(true);
        pwNote.setStyle("-fx-text-fill: " + TEXT_DIM + "; -fx-font-size: 10px;");

        VBox pwCard = card("Password (AES-256 key derivation)", passwordField, pwNote);

        // Cipher info panel (read-only display, updates when file selected)
        Label cipherInfoLabel = new Label("Select a file to see cipher profile.");
        cipherInfoLabel.setWrapText(true);
        cipherInfoLabel.setStyle("-fx-text-fill: " + TEXT_DIM + "; -fx-font-size: 11px;");

        // Update cipher info label when file changes
        browseBtn.setOnAction(e -> {
            FileChooser chooser = new FileChooser();
            chooser.setTitle("Select Media File");
            chooser.getExtensionFilters().addAll(
                new FileChooser.ExtensionFilter("Media Files",
                    "*.jpg","*.jpeg","*.png","*.gif","*.bmp","*.webp",
                    "*.mp3","*.ogg","*.flac","*.wav",
                    "*.mp4","*.avi","*.mkv",
                    "*.msec"),
                new FileChooser.ExtensionFilter("All Files", "*.*")
            );
            File f = chooser.showOpenDialog(stage);
            if (f != null) {
                selectedFile = f;
                selectedFileLabel.setText(f.getName() + "  (" + formatSize(f.length()) + ")");
                selectedFileLabel.setStyle("-fx-text-fill: " + TEXT_WHITE + "; -fx-font-size: 12px;");

                // Show which cipher profile would be selected
                if (!f.getName().endsWith(".msec")) {
                    try {
                        byte[] hdr = new byte[16];
                        try (var in = new java.io.FileInputStream(f)) { in.read(hdr); }
                        MediaType mt = MediaType.detect(hdr);
                        CipherProfile cp = CipherProfile.selectFor(f.length(), mt);
                        cipherInfoLabel.setText(
                            "Detected: " + mt.getDisplayName() + "\n" +
                            "Cipher: " + cp.getDisplayName() + "\n" +
                            cp.getRationale());
                        cipherInfoLabel.setStyle("-fx-text-fill: " + ACCENT_CYAN + "; -fx-font-size: 11px;");
                    } catch (Exception ex) {
                        cipherInfoLabel.setText("Could not inspect file.");
                        cipherInfoLabel.setStyle("-fx-text-fill: " + TEXT_DIM + "; -fx-font-size: 11px;");
                    }
                } else {
                    cipherInfoLabel.setText("MSEC encrypted file selected — choose Decrypt mode.");
                    cipherInfoLabel.setStyle("-fx-text-fill: " + ACCENT_GREEN + "; -fx-font-size: 11px;");
                }
            }
        });

        VBox cipherCard = card("Cipher Profile (auto-selected)", cipherInfoLabel);

        // Execute button
        spinner = new ProgressIndicator();
        spinner.setPrefSize(24, 24);
        spinner.setVisible(false);
        spinner.setStyle("-fx-accent: " + ACCENT_CYAN + ";");

        Button execBtn = actionButton("Run Operation", ACCENT_GREEN);
        execBtn.setMaxWidth(Double.MAX_VALUE);
        execBtn.setOnAction(e -> runOperation(stage));

        HBox execRow = new HBox(10, execBtn, spinner);
        execRow.setAlignment(Pos.CENTER_LEFT);
        HBox.setHgrow(execBtn, Priority.ALWAYS);

        VBox left = new VBox(16, sectionLabel, fileCard, pwCard, cipherCard, execRow);
        left.setPadding(new Insets(16));
        left.setStyle("-fx-background-color: " + BG_PANEL + ";");
        return left;
    }

    @SuppressWarnings("unchecked")
    private VBox buildRightPanel() {
        Label sectionLabel = styledSectionLabel("OPERATION LOG");

        TableView<OperationRow> table = new TableView<>(opLog);
        table.setStyle("-fx-background-color: " + BG_DARK + "; -fx-border-color: " + BG_CARD + ";");
        table.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY_FLEX_LAST_COLUMN);
        table.setPlaceholder(new Label("No operations yet."));

        TableColumn<OperationRow, String> colFile = col("File", "fileName", 180);
        TableColumn<OperationRow, String> colType = col("Type", "mediaType", 90);
        TableColumn<OperationRow, String> colCipher = col("Cipher", "cipher", 110);
        TableColumn<OperationRow, String> colSize = col("Size", "size", 80);
        TableColumn<OperationRow, String> colStatus = col("Status", "status", 90);
        TableColumn<OperationRow, String> colHmac = col("HMAC-SHA256 (first 16)", "hmacShort", 160);

        // Color-code status column
        colStatus.setCellFactory(tc -> new TableCell<>() {
            @Override
            protected void updateItem(String item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) { setText(null); setStyle(""); return; }
                setText(item);
                if (item.equals("Encrypted") || item.equals("Decrypted")) {
                    setStyle("-fx-text-fill: " + ACCENT_GREEN + "; -fx-font-weight: bold;");
                } else if (item.equals("Failed")) {
                    setStyle("-fx-text-fill: " + ACCENT_RED + "; -fx-font-weight: bold;");
                } else {
                    setStyle("-fx-text-fill: " + TEXT_DIM + ";");
                }
            }
        });

        table.getColumns().addAll(colFile, colType, colCipher, colSize, colStatus, colHmac);
        VBox.setVgrow(table, Priority.ALWAYS);

        // Detail area — shows selected row's HMAC and error detail
        TextArea detail = new TextArea();
        detail.setEditable(false);
        detail.setPrefHeight(100);
        detail.setStyle("-fx-control-inner-background: " + BG_DARK + "; -fx-text-fill: " + TEXT_WHITE + "; " +
                "-fx-font-family: 'Consolas'; -fx-font-size: 11px; -fx-border-color: " + BG_CARD + ";");
        detail.setPromptText("Select a row to see full HMAC and error detail...");

        table.getSelectionModel().selectedItemProperty().addListener((ob, ov, row) -> {
            if (row == null) { detail.clear(); return; }
            StringBuilder sb = new StringBuilder();
            sb.append("File:       ").append(row.getFileName()).append("\n");
            sb.append("Status:     ").append(row.getStatus()).append("\n");
            sb.append("HMAC-SHA256: ").append(row.getFullHmac()).append("\n");
            if (!row.getError().isEmpty())
                sb.append("Error:      ").append(row.getError()).append("\n");
            detail.setText(sb.toString());
        });

        VBox right = new VBox(12, sectionLabel, table, detail);
        right.setPadding(new Insets(16));
        right.setStyle("-fx-background-color: " + BG_DARK + ";");
        return right;
    }

    // ── Status bar ───────────────────────────────────────────────────────────

    private HBox buildStatusBar() {
        statusLabel = new Label("Ready.");
        statusLabel.setStyle("-fx-text-fill: " + TEXT_DIM + "; -fx-font-size: 12px;");

        HBox bar = new HBox(statusLabel);
        bar.setPadding(new Insets(8, 16, 8, 16));
        bar.setStyle("-fx-background-color: " + BG_PANEL + "; -fx-border-color: " + BG_CARD + "; " +
                "-fx-border-width: 1 0 0 0;");
        return bar;
    }

    // ── Operation execution ───────────────────────────────────────────────────

    private void runOperation(Stage stage) {
        if (selectedFile == null) {
            setStatus("No file selected.", ACCENT_RED);
            return;
        }
        char[] pw = passwordField.getText().toCharArray();
        if (pw.length < 8) {
            setStatus("Password must be at least 8 characters.", ACCENT_RED);
            return;
        }

        boolean isEncrypt = ((ToggleButton) modeGroup.getSelectedToggle()).getText().equals("Encrypt");

        // Choose output file
        FileChooser chooser = new FileChooser();
        chooser.setTitle("Save Output File");
        if (isEncrypt) {
            chooser.getExtensionFilters().add(
                new FileChooser.ExtensionFilter("MSEC Encrypted", "*.msec"));
            chooser.setInitialFileName(selectedFile.getName() + ".msec");
        } else {
            String name = selectedFile.getName();
            if (name.endsWith(".msec")) name = name.substring(0, name.length() - 5);
            chooser.setInitialFileName("decrypted_" + name);
            chooser.getExtensionFilters().add(
                new FileChooser.ExtensionFilter("All Files", "*.*"));
        }
        File outputFile = chooser.showSaveDialog(stage);
        if (outputFile == null) return;

        // Copy password chars before clearing the field
        final char[] pwCopy = Arrays.copyOf(pw, pw.length);
        passwordField.clear();
        Arrays.fill(pw, '\0');

        spinner.setVisible(true);
        setStatus("Working…", ACCENT_CYAN);

        final File inputFile = selectedFile;
        final boolean encrypt = isEncrypt;

        Task<FileIntegrityRecord> task = new Task<>() {
            @Override
            protected FileIntegrityRecord call() throws Exception {
                // Random 16-byte salt derived per-operation
                java.security.SecureRandom rng = new java.security.SecureRandom();
                byte[] salt = new byte[16];
                rng.nextBytes(salt);

                SecretKey key = engine.deriveKey(pwCopy, salt);
                Arrays.fill(pwCopy, '\0');

                if (encrypt) {
                    return engine.encrypt(inputFile, outputFile, key);
                } else {
                    return engine.decrypt(inputFile, outputFile, key);
                }
            }
        };

        task.setOnSucceeded(e -> {
            spinner.setVisible(false);
            FileIntegrityRecord rec = task.getValue();
            opLog.add(0, new OperationRow(rec));
            setStatus(rec.getFileName() + " → " + rec.getStatus() + " successfully.", ACCENT_GREEN);
        });

        task.setOnFailed(e -> {
            spinner.setVisible(false);
            Throwable ex = task.getException();
            String msg = ex != null ? ex.getMessage() : "Unknown error";

            // Create a failed record for display
            OperationRow row = new OperationRow(inputFile.getName(), "—", "—", "—", "Failed", "", msg);
            opLog.add(0, row);
            setStatus("Operation failed: " + msg, ACCENT_RED);
        });

        Thread t = new Thread(task, "media-crypto");
        t.setDaemon(true);
        t.start();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void setStatus(String msg, String color) {
        Platform.runLater(() -> {
            statusLabel.setText(msg);
            statusLabel.setStyle("-fx-text-fill: " + color + "; -fx-font-size: 12px;");
        });
    }

    private Label styledSectionLabel(String text) {
        Label l = new Label(text);
        l.setFont(Font.font("Segoe UI", FontWeight.BOLD, 11));
        l.setStyle("-fx-text-fill: " + TEXT_DIM + "; -fx-letter-spacing: 2;");
        return l;
    }

    private Button actionButton(String text, String color) {
        Button b = new Button(text);
        b.setStyle("-fx-background-color: " + color + "; -fx-text-fill: " + BG_DARK + "; " +
                "-fx-font-weight: bold; -fx-font-size: 13px; -fx-cursor: hand; " +
                "-fx-background-radius: 4; -fx-padding: 9 20;");
        return b;
    }

    private VBox card(String title, javafx.scene.Node... children) {
        Label lbl = new Label(title);
        lbl.setFont(Font.font("Segoe UI", FontWeight.SEMI_BOLD, 12));
        lbl.setStyle("-fx-text-fill: " + ACCENT_CYAN + ";");
        VBox box = new VBox(8, lbl);
        box.getChildren().addAll(children);
        box.setPadding(new Insets(12));
        box.setStyle("-fx-background-color: " + BG_CARD + "; -fx-background-radius: 6;");
        return box;
    }

    private <S, T> TableColumn<S, T> col(String title, String prop, int prefWidth) {
        TableColumn<S, T> c = new TableColumn<>(title);
        c.setCellValueFactory(new PropertyValueFactory<>(prop));
        c.setPrefWidth(prefWidth);
        c.setStyle("-fx-text-fill: " + TEXT_WHITE + ";");
        return c;
    }

    private String formatSize(long bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format("%.1f KB", bytes / 1024.0);
        if (bytes < 1024L * 1024 * 1024) return String.format("%.1f MB", bytes / (1024.0 * 1024));
        return String.format("%.2f GB", bytes / (1024.0 * 1024 * 1024));
    }

    public static void main(String[] args) {
        launch(args);
    }

    // ── Inner model class for table ───────────────────────────────────────────

    public static class OperationRow {
        private final String fileName;
        private final String mediaType;
        private final String cipher;
        private final String size;
        private final String status;
        private final String hmacShort;
        private final String fullHmac;
        private final String error;

        public OperationRow(FileIntegrityRecord rec) {
            this.fileName  = rec.getFileName();
            this.mediaType = rec.getMediaType() != null ? rec.getMediaType().getDisplayName() : "—";
            this.cipher    = rec.getHmacSha256() != null ? "AES-256" : "—";
            this.size      = formatB(rec.getOriginalSize());
            this.status    = rec.getStatus();
            this.fullHmac  = rec.getHmacSha256() != null ? rec.getHmacSha256() : "";
            this.hmacShort = fullHmac.length() > 16 ? fullHmac.substring(0, 16) + "…" : fullHmac;
            this.error     = rec.errorDetailProperty().get();
        }

        public OperationRow(String fileName, String mediaType, String cipher,
                            String size, String status, String fullHmac, String error) {
            this.fileName  = fileName;
            this.mediaType = mediaType;
            this.cipher    = cipher;
            this.size      = size;
            this.status    = status;
            this.fullHmac  = fullHmac;
            this.hmacShort = fullHmac.length() > 16 ? fullHmac.substring(0, 16) + "…" : fullHmac;
            this.error     = error;
        }

        private static String formatB(long b) {
            if (b <= 0) return "—";
            if (b < 1024) return b + " B";
            if (b < 1024*1024) return String.format("%.1f KB", b/1024.0);
            return String.format("%.1f MB", b/(1024.0*1024));
        }

        public String getFileName()  { return fileName; }
        public String getMediaType() { return mediaType; }
        public String getCipher()    { return cipher; }
        public String getSize()      { return size; }
        public String getStatus()    { return status; }
        public String getHmacShort() { return hmacShort; }
        public String getFullHmac()  { return fullHmac; }
        public String getError()     { return error; }
    }
}
