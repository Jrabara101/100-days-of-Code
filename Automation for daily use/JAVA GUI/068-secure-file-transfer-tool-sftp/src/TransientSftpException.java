/**
 * Transient SFTP failure — network hiccup, timeout, temporary server overload.
 * Safe to retry with backoff; the underlying connection may recover.
 */
public class TransientSftpException extends SftpException {
    public TransientSftpException(String message) { super(message); }
    public TransientSftpException(String message, Throwable cause) { super(message, cause); }
}
