import java.util.Random;

/**
 * Simulated SFTP back-end used when no real SSH server is available.
 *
 * Failure injection follows the same triage the real protocol would: a host-key
 * mismatch or bad credentials produces a TerminalSftpException (retrying with the
 * same params cannot succeed); a simulated timeout or packet loss produces a
 * TransientSftpException (a retry after backoff has a reasonable chance of working).
 *
 * Progress updates are produced in small increments to exercise the progress-bar
 * binding in the UI layer — the same code path a real streaming read/write would use.
 */
public class SimulatedSftpClient implements SftpClient {

    private static final int CHUNK_SIZE = 65_536; // 64 KB per simulated I/O round

    private final Random rng = new Random();
    private ConnectionProfile connectedProfile;
    private byte[] lastTransferredData;

    private boolean connected = false;

    // Configurable failure probabilities for demo/testing
    private double transientFailureChance = 0.0;
    private double terminalFailureChance  = 0.0;

    public SimulatedSftpClient() {}
    public SimulatedSftpClient(double transientChance, double terminalChance) {
        this.transientFailureChance = transientChance;
        this.terminalFailureChance  = terminalChance;
    }

    @Override
    public void connect(ConnectionProfile profile) throws SftpException {
        simulateSleep(300);

        // Host key validation — terminal if the fingerprint stored locally doesn't match
        String knownFp = profile.getKnownHostFingerprint();
        if (!knownFp.isEmpty() && knownFp.startsWith("MISMATCH")) {
            throw new TerminalSftpException(
                "Host key mismatch: server presented a different fingerprint. " +
                "Possible MITM. Aborting.");
        }

        // Credential check — terminal
        if (profile.getUsername() == null || profile.getUsername().isBlank()) {
            throw new TerminalSftpException("Authentication failed: empty username.");
        }

        // Simulated transient: port closed or packet loss during handshake
        if (rng.nextDouble() < transientFailureChance) {
            throw new TransientSftpException(
                "SSH handshake timed out. The server may be temporarily unreachable.");
        }

        connected = true;
        connectedProfile = profile;
    }

    @Override
    public void disconnect() {
        connected = false;
        connectedProfile = null;
    }

    @Override
    public void transfer(FileEntry entry, ProgressCallback onProgress) throws SftpException {
        if (!connected) throw new TransientSftpException("Not connected.");

        long total = entry.getSizeBytes();
        long transferred = 0;

        // Synthetic file bytes — only used for checksum computation
        lastTransferredData = new byte[(int) Math.min(total, 1_048_576)];
        rng.nextBytes(lastTransferredData);

        while (transferred < total) {
            // Simulate a transient mid-transfer failure (e.g. broken pipe)
            if (rng.nextDouble() < transientFailureChance) {
                throw new TransientSftpException(
                    "Transfer interrupted at " + transferred + "/" + total +
                    " bytes. Connection reset by peer.");
            }
            simulateSleep(20);
            long chunk = Math.min(CHUNK_SIZE, total - transferred);
            transferred += chunk;
            final long t = transferred;
            onProgress.update(t, total);
        }
    }

    @Override
    public String getRemoteChecksum(ChecksumAlgorithm algo) throws SftpException {
        if (!connected) throw new TransientSftpException("Not connected.");
        if (lastTransferredData == null) throw new TerminalSftpException("No file transferred yet.");
        // In a real client this would issue a "check-file-handle" extension request.
        // We compute it locally from the same synthetic bytes to produce a matching digest.
        return new IntegrityVerifier(algo).compute(lastTransferredData);
    }

    private void simulateSleep(long ms) {
        try { Thread.sleep(ms); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }
}
