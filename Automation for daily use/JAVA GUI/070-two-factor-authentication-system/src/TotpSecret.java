import javafx.beans.property.*;

/**
 * Observable domain model for a registered user account.
 * Uses JavaFX properties so the UI can bind directly to enrollment/auth state
 * without manual refresh calls.
 */
public class TotpSecret {

    private final StringProperty username = new SimpleStringProperty();
    private final StringProperty passwordHash = new SimpleStringProperty();
    private final StringProperty base32Secret = new SimpleStringProperty();
    private final BooleanProperty enrolled = new SimpleBooleanProperty(false);
    private final IntegerProperty failedAttempts = new SimpleIntegerProperty(0);
    private final LongProperty lastUsedStep = new SimpleLongProperty(-1);

    public TotpSecret(String username, String passwordHash) {
        this.username.set(username);
        this.passwordHash.set(passwordHash);
    }

    // Enrollment: assign a fresh TOTP secret to this account
    public void enroll(String secret) {
        base32Secret.set(secret);
        enrolled.set(true);
        failedAttempts.set(0);
    }

    public void resetEnrollment() {
        base32Secret.set(null);
        enrolled.set(false);
        failedAttempts.set(0);
        lastUsedStep.set(-1);
    }

    public void incrementFailedAttempts() {
        failedAttempts.set(failedAttempts.get() + 1);
    }

    public void resetFailedAttempts() {
        failedAttempts.set(0);
    }

    public void recordUsedStep(long step) {
        lastUsedStep.set(step);
    }

    /** Replay-attack guard: a given 30-second step can only be used once. */
    public boolean isStepAlreadyUsed(long step) {
        return lastUsedStep.get() == step;
    }

    public StringProperty usernameProperty() { return username; }
    public StringProperty passwordHashProperty() { return passwordHash; }
    public StringProperty base32SecretProperty() { return base32Secret; }
    public BooleanProperty enrolledProperty() { return enrolled; }
    public IntegerProperty failedAttemptsProperty() { return failedAttempts; }

    public String getUsername() { return username.get(); }
    public String getPasswordHash() { return passwordHash.get(); }
    public String getBase32Secret() { return base32Secret.get(); }
    public boolean isEnrolled() { return enrolled.get(); }
    public int getFailedAttempts() { return failedAttempts.get(); }

    // Simple SHA-256 password hashing (no salt, for demo; production would use bcrypt)
    public static String hashPassword(String raw) {
        try {
            var md = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(raw.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            var sb = new StringBuilder();
            for (byte b : hash) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }
}
