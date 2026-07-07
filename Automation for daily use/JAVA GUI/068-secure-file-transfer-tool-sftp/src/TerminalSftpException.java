/**
 * Terminal SFTP failure — bad credentials, host key mismatch, permission denied,
 * or remote path does not exist. Retrying with the same parameters cannot succeed.
 */
public class TerminalSftpException extends SftpException {
    public TerminalSftpException(String message) { super(message); }
    public TerminalSftpException(String message, Throwable cause) { super(message, cause); }
}
