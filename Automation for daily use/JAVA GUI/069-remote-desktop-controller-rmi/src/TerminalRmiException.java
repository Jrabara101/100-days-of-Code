/**
 * A terminal RMI failure: authentication rejection, access denied, or the
 * remote stub has been unregistered. Retrying the same connection attempt
 * will not help — the user must correct credentials or the host address.
 */
public final class TerminalRmiException extends RmiException {
    public TerminalRmiException(String message) {
        super(message);
    }
}
