/**
 * A remote input event to be dispatched to the host via RMI.
 *
 * Grouping mouse and keyboard events into one type makes the input buffer
 * a single ordered queue — important because interleaving them in separate
 * queues can reorder a "click then type" sequence that the remote app sees
 * as "type then click" (a subtle but real bug in naive dual-queue designs).
 */
public final class InputEvent {

    public enum Kind { MOUSE_MOVE, MOUSE_CLICK, KEY_PRESS }

    private final Kind kind;
    private final String description;
    private final long timestampMs;

    public InputEvent(Kind kind, String description) {
        this.kind = kind;
        this.description = description;
        this.timestampMs = System.currentTimeMillis();
    }

    public Kind kind() { return kind; }
    public String description() { return description; }
    public long timestampMs() { return timestampMs; }

    @Override
    public String toString() {
        return String.format("[%s] %s", kind, description);
    }
}
