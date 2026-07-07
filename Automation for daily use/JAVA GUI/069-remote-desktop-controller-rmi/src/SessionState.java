/**
 * Lifecycle states for an RMI remote desktop session.
 * Transitions: IDLE -> CONNECTING -> AUTHENTICATING -> ACTIVE
 *              ACTIVE -> DISCONNECTING -> IDLE
 *              Any state -> FAILED on unrecoverable error
 *              CONNECTING/AUTHENTICATING -> RECONNECTING -> CONNECTING on transient failure
 */
public enum SessionState {
    IDLE,
    CONNECTING,
    AUTHENTICATING,
    ACTIVE,
    RECONNECTING,
    DISCONNECTING,
    FAILED
}
