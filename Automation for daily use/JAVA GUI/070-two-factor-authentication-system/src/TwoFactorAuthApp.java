import javafx.animation.*;
import javafx.application.Application;
import javafx.beans.binding.Bindings;
import javafx.geometry.*;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.layout.*;
import javafx.scene.paint.Color;
import javafx.scene.shape.Circle;
import javafx.scene.text.*;
import javafx.stage.Stage;
import javafx.util.Duration;

import java.time.Instant;

public class TwoFactorAuthApp extends Application {

    // ── Color palette ─────────────────────────────────────────────────────────
    private static final String BG_DARK    = "#0d1117";
    private static final String BG_PANEL   = "#161b22";
    private static final String BG_CARD    = "#21262d";
    private static final String ACCENT     = "#58a6ff";
    private static final String SUCCESS    = "#3fb950";
    private static final String DANGER     = "#f85149";
    private static final String WARNING    = "#e3b341";
    private static final String TEXT_PRI   = "#e6edf3";
    private static final String TEXT_SEC   = "#8b949e";
    private static final String BORDER     = "#30363d";

    private final AccountStore store = new AccountStore();
    private AuthSession session;
    private StackPane rootStack;

    @Override
    public void start(Stage stage) {
        rootStack = new StackPane();
        rootStack.setStyle("-fx-background-color: " + BG_DARK + ";");

        showLoginScreen();

        Scene scene = new Scene(rootStack, 480, 580);
        stage.setTitle("Two-Factor Authentication System");
        stage.setScene(scene);
        stage.setResizable(false);
        stage.show();
    }

    // ── Screens ───────────────────────────────────────────────────────────────

    private void showLoginScreen() {
        session = new AuthSession(store);
        session.beginLogin();

        VBox card = buildCard();
        card.setPrefWidth(380);

        // Header
        Label title = label("Sign In", 22, true, TEXT_PRI);
        Label subtitle = label("Two-Factor Authentication Portal", 13, false, TEXT_SEC);
        VBox header = new VBox(4, title, subtitle);
        header.setAlignment(Pos.CENTER);

        // Status indicator
        Label statusLabel = label("", 12, false, TEXT_SEC);
        statusLabel.textProperty().bind(session.statusMessageProperty());
        statusLabel.setWrapText(true);
        statusLabel.setMaxWidth(340);
        statusLabel.setAlignment(Pos.CENTER);
        statusLabel.setTextAlignment(TextAlignment.CENTER);

        // Fields
        TextField usernameField = styledField("Username");
        PasswordField passwordField = styledPassword("Password");

        // Hint: show demo credentials
        Label hint = label("Demo: admin / secret123", 11, false, TEXT_SEC);
        hint.setStyle("-fx-text-fill: " + TEXT_SEC + "; -fx-font-style: italic;");

        Button loginBtn = accentButton("Sign In", ACCENT);
        loginBtn.setMaxWidth(Double.MAX_VALUE);

        loginBtn.setOnAction(e -> {
            boolean ok = session.submitPassword(
                    usernameField.getText().trim(),
                    passwordField.getText());
            if (ok) {
                AuthState next = session.getState();
                if (next == AuthState.AWAITING_TOTP) {
                    showTotpScreen();
                } else if (next == AuthState.ENROLLMENT) {
                    showEnrollmentScreen();
                }
            } else {
                flash(statusLabel, DANGER);
            }
        });

        // Register link
        Hyperlink registerLink = new Hyperlink("Register new account");
        registerLink.setStyle("-fx-text-fill: " + ACCENT + "; -fx-border-color: transparent;");
        registerLink.setOnAction(e -> showRegisterScreen());

        card.getChildren().addAll(header, separator(), usernameField, passwordField,
                hint, loginBtn, registerLink, statusLabel);
        card.setAlignment(Pos.CENTER);

        fadeIn(card);
        rootStack.getChildren().setAll(card);
    }

    private void showTotpScreen() {
        VBox card = buildCard();
        card.setPrefWidth(380);

        // Header
        Label title = label("Authenticator Code", 20, true, TEXT_PRI);
        Label subtitle = label("Enter the 6-digit code from your authenticator app.", 12, false, TEXT_SEC);
        subtitle.setWrapText(true);
        subtitle.setTextAlignment(TextAlignment.CENTER);
        VBox header = new VBox(6, title, subtitle);
        header.setAlignment(Pos.CENTER);

        // Countdown ring — visual indicator of time left in current 30s window
        ProgressIndicator ring = new ProgressIndicator(1.0);
        ring.setPrefSize(54, 54);
        ring.setStyle("-fx-accent: " + ACCENT + ";");

        Label countdownLabel = label("30s", 13, true, TEXT_SEC);
        StackPane ringPane = new StackPane(ring, countdownLabel);

        Timeline countdown = new Timeline(new KeyFrame(Duration.seconds(1), ev -> {
            int left = TotpAlgorithm.secondsUntilNextWindow();
            ring.setProgress(left / 30.0);
            countdownLabel.setText(left + "s");
            String color = left <= 5 ? DANGER : left <= 10 ? WARNING : ACCENT;
            ring.setStyle("-fx-accent: " + color + ";");
            countdownLabel.setStyle("-fx-text-fill: " + color + "; -fx-font-weight: bold;");
        }));
        countdown.setCycleCount(Animation.INDEFINITE);
        countdown.play();

        // Attempts
        Label attemptsLabel = label("3 attempts left", 12, false, TEXT_SEC);
        attemptsLabel.textProperty().bind(
                Bindings.concat(session.totpAttemptsLeftProperty().asString(), " attempts left"));

        // Code input — individual digit-style text field
        TextField codeField = new TextField();
        codeField.setPromptText("000000");
        codeField.setMaxWidth(160);
        codeField.setAlignment(Pos.CENTER);
        codeField.setStyle(
            "-fx-background-color: " + BG_CARD + ";" +
            "-fx-text-fill: " + TEXT_PRI + ";" +
            "-fx-font-size: 28px;" +
            "-fx-font-weight: bold;" +
            "-fx-letter-spacing: 6px;" +
            "-fx-border-color: " + BORDER + ";" +
            "-fx-border-radius: 8;" +
            "-fx-background-radius: 8;" +
            "-fx-padding: 10 16;"
        );
        // Auto-limit to 6 digits
        codeField.textProperty().addListener((obs, o, n) -> {
            if (!n.matches("\\d*")) codeField.setText(n.replaceAll("[^\\d]", ""));
            if (n.length() > 6) codeField.setText(n.substring(0, 6));
        });

        Label statusLabel = label("", 12, false, TEXT_SEC);
        statusLabel.textProperty().bind(session.statusMessageProperty());
        statusLabel.setWrapText(true);
        statusLabel.setTextAlignment(TextAlignment.CENTER);

        Button verifyBtn = accentButton("Verify", ACCENT);
        verifyBtn.setMaxWidth(200);

        verifyBtn.setOnAction(e -> {
            try {
                session.submitTotpCode(codeField.getText().trim());
                countdown.stop();
                showSuccessScreen(session.authenticatedUserProperty().get());
            } catch (TotpException ex) {
                if (ex instanceof ExpiredWindowException) {
                    statusLabel.setStyle("-fx-text-fill: " + DANGER + "; -fx-font-size: 12px;");
                    flash(statusLabel, DANGER);
                    countdown.stop();
                    new Timeline(new KeyFrame(Duration.seconds(2), ev2 -> showLoginScreen())).play();
                } else if (ex instanceof InvalidCodeException ice) {
                    codeField.clear();
                    flash(statusLabel, ice.isRetryable() ? WARNING : DANGER);
                    if (!ice.isRetryable()) {
                        countdown.stop();
                        new Timeline(new KeyFrame(Duration.seconds(2), ev2 -> showLoginScreen())).play();
                    }
                }
            }
        });

        // Also show the TOTP secret for the demo (so user can enter the code)
        TotpSecret acct = session.getCurrentAccount();
        String liveCode = TotpAlgorithm.currentCode(acct.getBase32Secret());
        Label demoHint = label("Demo code (refreshes each window): " + liveCode, 11, false, TEXT_SEC);
        demoHint.setStyle("-fx-text-fill: " + TEXT_SEC + "; -fx-font-style: italic;");

        VBox centerContent = new VBox(8, ringPane, attemptsLabel);
        centerContent.setAlignment(Pos.CENTER);

        card.getChildren().addAll(header, separator(), centerContent, codeField,
                verifyBtn, demoHint, statusLabel);
        card.setAlignment(Pos.CENTER);

        fadeIn(card);
        rootStack.getChildren().setAll(card);
    }

    private void showEnrollmentScreen() {
        VBox card = buildCard();
        card.setPrefWidth(380);

        Label title = label("Enroll in 2FA", 20, true, TEXT_PRI);
        Label subtitle = label(
            "Your account is not yet enrolled. Scan the secret below " +
            "into your authenticator app (Google Authenticator, Authy, etc.), " +
            "then confirm your password to complete enrollment.",
            12, false, TEXT_SEC);
        subtitle.setWrapText(true);
        subtitle.setTextAlignment(TextAlignment.CENTER);
        subtitle.setMaxWidth(340);
        VBox header = new VBox(6, title, subtitle);
        header.setAlignment(Pos.CENTER);

        // Display the base32 secret prominently
        TotpSecret acct = session.getCurrentAccount();
        String secret = TotpAlgorithm.generateSecret(); // new secret before enrollment
        // We'll confirm enrollment with password button click

        Label secretBox = new Label(formatSecret(acct.getBase32Secret().isEmpty()
                ? secret : acct.getBase32Secret()));
        secretBox.setStyle(
            "-fx-background-color: " + BG_CARD + ";" +
            "-fx-text-fill: " + WARNING + ";" +
            "-fx-font-family: monospace;" +
            "-fx-font-size: 15px;" +
            "-fx-font-weight: bold;" +
            "-fx-letter-spacing: 2px;" +
            "-fx-padding: 12 16;" +
            "-fx-border-color: " + BORDER + ";" +
            "-fx-border-radius: 6;" +
            "-fx-background-radius: 6;"
        );
        secretBox.setWrapText(true);
        secretBox.setMaxWidth(340);
        secretBox.setAlignment(Pos.CENTER);

        Label secretNote = label("Add this secret as a manual TOTP entry in your authenticator app.", 11, false, TEXT_SEC);
        secretNote.setWrapText(true);
        secretNote.setTextAlignment(TextAlignment.CENTER);
        secretNote.setStyle("-fx-text-fill: " + TEXT_SEC + "; -fx-font-style: italic;");

        PasswordField confirmPwd = styledPassword("Confirm your password");

        Label statusLabel = label("", 12, false, TEXT_SEC);
        statusLabel.textProperty().bind(session.statusMessageProperty());
        statusLabel.setWrapText(true);
        statusLabel.setTextAlignment(TextAlignment.CENTER);

        Button enrollBtn = accentButton("Complete Enrollment", SUCCESS);
        enrollBtn.setMaxWidth(Double.MAX_VALUE);
        enrollBtn.setOnAction(e -> {
            session.enrollAccount(confirmPwd.getText());
            if (session.getState() == AuthState.AWAITING_TOTP) {
                showTotpScreen();
            } else {
                flash(statusLabel, DANGER);
            }
        });

        card.getChildren().addAll(header, separator(), secretBox, secretNote,
                confirmPwd, enrollBtn, statusLabel);
        card.setAlignment(Pos.CENTER);

        fadeIn(card);
        rootStack.getChildren().setAll(card);
    }

    private void showRegisterScreen() {
        VBox card = buildCard();
        card.setPrefWidth(380);

        Label title = label("Create Account", 20, true, TEXT_PRI);
        Label subtitle = label("Register a new user. You will enroll in 2FA on first login.", 12, false, TEXT_SEC);
        subtitle.setWrapText(true);
        subtitle.setTextAlignment(TextAlignment.CENTER);
        VBox header = new VBox(6, title, subtitle);
        header.setAlignment(Pos.CENTER);

        TextField newUser = styledField("Username");
        PasswordField newPwd = styledPassword("Password");
        PasswordField confirmPwd = styledPassword("Confirm Password");

        Label statusLabel = label("", 12, false, DANGER);
        statusLabel.setWrapText(true);

        Button createBtn = accentButton("Create Account", SUCCESS);
        createBtn.setMaxWidth(Double.MAX_VALUE);
        createBtn.setOnAction(e -> {
            String username = newUser.getText().trim();
            String pwd = newPwd.getText();
            String confirm = confirmPwd.getText();

            if (username.isEmpty() || pwd.isEmpty()) {
                statusLabel.setText("Username and password are required.");
                return;
            }
            if (!pwd.equals(confirm)) {
                statusLabel.setText("Passwords do not match.");
                return;
            }
            if (store.usernameExists(username)) {
                statusLabel.setText("Username already taken.");
                return;
            }
            store.register(username, pwd);
            statusLabel.setStyle("-fx-text-fill: " + SUCCESS + "; -fx-font-size: 12px;");
            statusLabel.setText("Account created! You can now sign in.");
            new Timeline(new KeyFrame(Duration.seconds(1.5), ev -> showLoginScreen())).play();
        });

        Hyperlink backLink = new Hyperlink("Back to Sign In");
        backLink.setStyle("-fx-text-fill: " + ACCENT + "; -fx-border-color: transparent;");
        backLink.setOnAction(e -> showLoginScreen());

        card.getChildren().addAll(header, separator(), newUser, newPwd, confirmPwd,
                createBtn, backLink, statusLabel);
        card.setAlignment(Pos.CENTER);

        fadeIn(card);
        rootStack.getChildren().setAll(card);
    }

    private void showSuccessScreen(String username) {
        VBox card = buildCard();
        card.setPrefWidth(380);
        card.setAlignment(Pos.CENTER);

        // Green checkmark circle
        Circle circle = new Circle(36);
        circle.setFill(Color.web(SUCCESS, 0.15));
        circle.setStroke(Color.web(SUCCESS));
        circle.setStrokeWidth(2);
        Label check = label("✓", 32, true, SUCCESS);
        StackPane icon = new StackPane(circle, check);

        Label successTitle = label("Authenticated!", 22, true, SUCCESS);
        Label welcomeMsg = label("Welcome back, " + username + ".", 14, false, TEXT_PRI);
        Label note = label("Your identity has been verified via two-factor authentication.", 12, false, TEXT_SEC);
        note.setWrapText(true);
        note.setTextAlignment(TextAlignment.CENTER);
        note.setMaxWidth(300);

        Button logoutBtn = accentButton("Sign Out", DANGER);
        logoutBtn.setMaxWidth(200);
        logoutBtn.setOnAction(e -> showLoginScreen());

        card.getChildren().addAll(icon, successTitle, welcomeMsg, note, separator(), logoutBtn);

        fadeIn(card);
        rootStack.getChildren().setAll(card);
    }

    // ── UI helpers ────────────────────────────────────────────────────────────

    private VBox buildCard() {
        VBox card = new VBox(14);
        card.setAlignment(Pos.TOP_CENTER);
        card.setPadding(new Insets(36, 36, 36, 36));
        card.setStyle(
            "-fx-background-color: " + BG_PANEL + ";" +
            "-fx-border-color: " + BORDER + ";" +
            "-fx-border-radius: 12;" +
            "-fx-background-radius: 12;"
        );
        StackPane.setAlignment(card, Pos.CENTER);
        return card;
    }

    private Label label(String text, double size, boolean bold, String colorHex) {
        Label l = new Label(text);
        l.setStyle(
            "-fx-text-fill: " + colorHex + ";" +
            "-fx-font-size: " + size + "px;" +
            (bold ? "-fx-font-weight: bold;" : "")
        );
        return l;
    }

    private TextField styledField(String prompt) {
        TextField f = new TextField();
        f.setPromptText(prompt);
        f.setMaxWidth(Double.MAX_VALUE);
        applyFieldStyle(f);
        return f;
    }

    private PasswordField styledPassword(String prompt) {
        PasswordField f = new PasswordField();
        f.setPromptText(prompt);
        f.setMaxWidth(Double.MAX_VALUE);
        applyFieldStyle(f);
        return f;
    }

    private void applyFieldStyle(TextInputControl f) {
        f.setStyle(
            "-fx-background-color: " + BG_CARD + ";" +
            "-fx-text-fill: " + TEXT_PRI + ";" +
            "-fx-prompt-text-fill: " + TEXT_SEC + ";" +
            "-fx-font-size: 13px;" +
            "-fx-border-color: " + BORDER + ";" +
            "-fx-border-radius: 6;" +
            "-fx-background-radius: 6;" +
            "-fx-padding: 9 12;"
        );
    }

    private Button accentButton(String text, String colorHex) {
        Button b = new Button(text);
        b.setStyle(
            "-fx-background-color: " + colorHex + ";" +
            "-fx-text-fill: " + BG_DARK + ";" +
            "-fx-font-size: 13px;" +
            "-fx-font-weight: bold;" +
            "-fx-cursor: hand;" +
            "-fx-padding: 9 20;" +
            "-fx-background-radius: 6;"
        );
        b.setOnMouseEntered(e -> b.setOpacity(0.85));
        b.setOnMouseExited(e -> b.setOpacity(1.0));
        return b;
    }

    private Separator separator() {
        Separator sep = new Separator();
        sep.setStyle("-fx-background-color: " + BORDER + ";");
        return sep;
    }

    private void fadeIn(javafx.scene.Node node) {
        FadeTransition ft = new FadeTransition(Duration.millis(250), node);
        ft.setFromValue(0);
        ft.setToValue(1);
        ft.play();
    }

    private void flash(Label label, String colorHex) {
        label.setStyle("-fx-text-fill: " + colorHex + "; -fx-font-size: 12px; -fx-font-weight: bold;");
        FadeTransition ft = new FadeTransition(Duration.millis(120), label);
        ft.setFromValue(0.3);
        ft.setToValue(1.0);
        ft.setCycleCount(2);
        ft.setAutoReverse(true);
        ft.play();
    }

    // Format a base32 secret as groups of 4 for readability
    private String formatSecret(String secret) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < secret.length(); i++) {
            if (i > 0 && i % 4 == 0) sb.append(' ');
            sb.append(secret.charAt(i));
        }
        return sb.toString();
    }

    public static void main(String[] args) {
        launch(args);
    }
}
