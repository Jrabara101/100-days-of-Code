import java.util.List;

/**
 * Abstraction for the RMI remote-desktop transport layer.
 * A real implementation would look up a {@code java.rmi.Remote} stub via
 * {@code Naming.lookup("rmi://host:1099/RemoteDesktop")} and delegate to it.
 */
public interface RmiTransport {

    /**
     * Connect to the remote host and perform authentication.
     * @throws TransientRmiException if the connection timed out (safe to retry).
     * @throws TerminalRmiException  if authentication was rejected (don't retry).
     */
    void connect(String host, int port, String username, String password) throws RmiException;

    /**
     * Send a batch of input events to the remote host.
     * @throws TransientRmiException if the RMI call failed transiently.
     */
    void sendInputBatch(List<InputEvent> events) throws RmiException;

    /**
     * Poll the remote framebuffer for a list of dirty regions.
     * @throws TransientRmiException on transient channel failure.
     */
    List<String> pollDirtyRegions() throws RmiException;

    void disconnect();
}
