/**
 * Base checked exception for RMI transport and protocol failures.
 * Subclasses distinguish retryable failures from terminal ones so
 * the session manager can apply the correct reconnect policy.
 */
public class RmiException extends Exception {
    public RmiException(String message) {
        super(message);
    }

    public RmiException(String message, Throwable cause) {
        super(message, cause);
    }
}
