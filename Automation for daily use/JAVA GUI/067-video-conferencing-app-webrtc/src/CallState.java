/**
 * Lifecycle of a single call session. Modeled explicitly (rather than a
 * loose boolean "connected" flag) because a real WebRTC call has distinct
 * failure/recovery paths that the UI must react to differently: a dropped
 * connection during RECONNECTING should keep the participant tiles on
 * screen (frozen last frame + spinner), while FAILED should tear them down.
 */
public enum CallState {
    IDLE,
    DIALING,
    RINGING,
    NEGOTIATING,
    CONNECTED,
    RECONNECTING,
    ENDED,
    FAILED
}
