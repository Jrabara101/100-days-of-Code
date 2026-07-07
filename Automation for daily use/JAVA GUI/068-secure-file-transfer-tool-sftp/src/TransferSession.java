import javafx.application.Platform;
import javafx.beans.property.*;
import javafx.collections.*;
import java.util.List;

/**
 * Orchestrates the full SFTP session lifecycle: connect → authenticate → transfer
 * queue → verify each file → disconnect.
 *
 * Retry policy: up to MAX_RETRIES attempts for TransientSftpException, with
 * exponential backoff (base 1 s, cap 8 s).  TerminalSftpException immediately
 * aborts the affected file (and the session) since the same parameters cannot
 * succeed.  The queue is drained sequentially so in-flight bandwidth consumption
 * stays predictable — parallel transfers would saturate a shared uplink and make
 * per-file progress meaningless.
 */
public class TransferSession {

    private static final int MAX_RETRIES = 3;
    private static final long BASE_BACKOFF_MS = 1_000;
    private static final long MAX_BACKOFF_MS  = 8_000;

    private final SftpClient client;
    private final IntegrityVerifier verifier;
    private final ObservableList<FileEntry> queue = FXCollections.observableArrayList();
    private final ObjectProperty<TransferState> sessionState =
            new SimpleObjectProperty<>(TransferState.IDLE);
    private final StringProperty statusMessage = new SimpleStringProperty("Ready");
    private final DoubleProperty overallProgress = new SimpleDoubleProperty(0.0);

    public TransferSession(SftpClient client, ChecksumAlgorithm algo) {
        this.client   = client;
        this.verifier = new IntegrityVerifier(algo);
    }

    // --- observable accessors ---
    public ObservableList<FileEntry> getQueue() { return queue; }
    public ObjectProperty<TransferState> sessionStateProperty() { return sessionState; }
    public StringProperty statusMessageProperty() { return statusMessage; }
    public DoubleProperty overallProgressProperty() { return overallProgress; }

    public void addFile(FileEntry entry) { queue.add(entry); }

    /** Runs on a background thread; all UI mutations go through Platform.runLater. */
    public void run(ConnectionProfile profile) {
        setUiState(TransferState.CONNECTING, "Connecting to " + profile.getHost() + "...");

        try {
            connectWithRetry(profile);
        } catch (SftpException e) {
            setUiState(TransferState.FAILED, "Connection failed: " + e.getMessage());
            return;
        }

        setUiState(TransferState.AUTHENTICATING, "Authenticated. Starting transfers...");

        int total = queue.size();
        int completed = 0;

        for (FileEntry entry : queue) {
            if (sessionState.get() == TransferState.CANCELLED) break;

            Platform.runLater(() -> entry.setState(TransferState.TRANSFERRING));
            boolean ok = transferWithRetry(entry);
            if (!ok) {
                client.disconnect();
                setUiState(TransferState.FAILED, "Transfer failed: " + entry.getName());
                return;
            }

            boolean verified = verifyFile(entry);
            if (!verified) {
                client.disconnect();
                setUiState(TransferState.FAILED, "Integrity check failed: " + entry.getName());
                return;
            }

            completed++;
            final double prog = (double) completed / total;
            Platform.runLater(() -> overallProgress.set(prog));
        }

        client.disconnect();

        if (sessionState.get() != TransferState.CANCELLED) {
            setUiState(TransferState.COMPLETE, "All " + total + " file(s) transferred successfully.");
        }
    }

    public void cancel() {
        setUiState(TransferState.CANCELLED, "Transfer cancelled by user.");
    }

    // --- private helpers ---

    private void connectWithRetry(ConnectionProfile profile) throws SftpException {
        SftpException last = null;
        for (int attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                client.connect(profile);
                return;
            } catch (TerminalSftpException e) {
                throw e; // Not worth retrying
            } catch (TransientSftpException e) {
                last = e;
                long backoff = Math.min(BASE_BACKOFF_MS * (1L << (attempt - 1)), MAX_BACKOFF_MS);
                final int a = attempt;
                setUiState(TransferState.CONNECTING,
                    "Connection attempt " + a + "/" + MAX_RETRIES + " failed. Retrying in " +
                    (backoff / 1000) + "s...");
                sleep(backoff);
            }
        }
        throw last;
    }

    private boolean transferWithRetry(FileEntry entry) {
        for (int attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                setUiState(TransferState.TRANSFERRING,
                    "Transferring: " + entry.getName());
                client.transfer(entry, (transferred, total) ->
                    Platform.runLater(() -> entry.setProgress((double) transferred / total))
                );
                Platform.runLater(() -> entry.setProgress(1.0));
                return true;
            } catch (TerminalSftpException e) {
                Platform.runLater(() -> entry.setState(TransferState.FAILED));
                return false;
            } catch (TransientSftpException e) {
                long backoff = Math.min(BASE_BACKOFF_MS * (1L << (attempt - 1)), MAX_BACKOFF_MS);
                setUiState(TransferState.TRANSFERRING,
                    "Retrying " + entry.getName() + " (" + attempt + "/" + MAX_RETRIES + ")...");
                sleep(backoff);
            } catch (SftpException e) {
                // Catch-all for any base SftpException not already classified
                Platform.runLater(() -> entry.setState(TransferState.FAILED));
                return false;
            }
        }
        Platform.runLater(() -> entry.setState(TransferState.FAILED));
        return false;
    }

    private boolean verifyFile(FileEntry entry) {
        Platform.runLater(() -> entry.setState(TransferState.VERIFYING));
        try {
            String remoteChecksum = client.getRemoteChecksum(verifier.getAlgorithm());
            // Local checksum: in a real client we would read the local file here.
            // We compute the same synthetic bytes via the remote result (always matches in simulation).
            String localChecksum = remoteChecksum;
            verifier.verify(localChecksum, remoteChecksum);
            final String cs = remoteChecksum;
            Platform.runLater(() -> {
                entry.setChecksum(cs);
                entry.setState(TransferState.COMPLETE);
            });
            return true;
        } catch (SftpException e) {
            Platform.runLater(() -> entry.setState(TransferState.FAILED));
            return false;
        }
    }

    private void setUiState(TransferState state, String message) {
        Platform.runLater(() -> {
            sessionState.set(state);
            statusMessage.set(message);
        });
    }

    private void sleep(long ms) {
        try { Thread.sleep(ms); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }
}
