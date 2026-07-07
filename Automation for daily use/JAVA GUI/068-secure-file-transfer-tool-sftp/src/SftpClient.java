/**
 * Abstraction over an SFTP transport layer.
 *
 * Separates the connection lifecycle from UI code so the simulated implementation
 * can be swapped for a real JSch/Apache MINA SSHD implementation without touching
 * the application layer.
 */
public interface SftpClient {
    void connect(ConnectionProfile profile) throws SftpException;
    void disconnect();

    /**
     * Transfer a file in the given direction, reporting incremental progress.
     * @param entry   file metadata and observable state
     * @param onProgress callback invoked with (bytesTransferred, totalBytes) on the JavaFX thread
     */
    void transfer(FileEntry entry, ProgressCallback onProgress) throws SftpException;

    /** Retrieve the server-side checksum for the most recently transferred file. */
    String getRemoteChecksum(ChecksumAlgorithm algo) throws SftpException;

    @FunctionalInterface
    interface ProgressCallback {
        void update(long bytesTransferred, long totalBytes);
    }
}
