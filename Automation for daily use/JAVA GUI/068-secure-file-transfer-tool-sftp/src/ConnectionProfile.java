import javafx.beans.property.*;

/**
 * Immutable-once-committed profile describing an SFTP endpoint.
 *
 * Host key fingerprint is stored alongside credentials so the client can detect
 * a MITM attack or accidental wrong-server connection before any data moves.
 * Storing it as a separate field (rather than baked into the host string) mirrors
 * how OpenSSH's known_hosts file separates identity from address.
 */
public class ConnectionProfile {

    private final StringProperty host = new SimpleStringProperty();
    private final IntegerProperty port = new SimpleIntegerProperty(22);
    private final StringProperty username = new SimpleStringProperty();
    private final StringProperty password = new SimpleStringProperty();
    private final StringProperty knownHostFingerprint = new SimpleStringProperty("");
    private final StringProperty remotePath = new SimpleStringProperty("/");

    public ConnectionProfile() {}

    public ConnectionProfile(String host, int port, String username,
                              String password, String remotePath, String fingerprint) {
        this.host.set(host);
        this.port.set(port);
        this.username.set(username);
        this.password.set(password);
        this.remotePath.set(remotePath);
        this.knownHostFingerprint.set(fingerprint);
    }

    public StringProperty hostProperty() { return host; }
    public IntegerProperty portProperty() { return port; }
    public StringProperty usernameProperty() { return username; }
    public StringProperty passwordProperty() { return password; }
    public StringProperty knownHostFingerprintProperty() { return knownHostFingerprint; }
    public StringProperty remotePathProperty() { return remotePath; }

    public String getHost() { return host.get(); }
    public int getPort() { return port.get(); }
    public String getUsername() { return username.get(); }
    public String getPassword() { return password.get(); }
    public String getKnownHostFingerprint() { return knownHostFingerprint.get(); }
    public String getRemotePath() { return remotePath.get(); }
}
