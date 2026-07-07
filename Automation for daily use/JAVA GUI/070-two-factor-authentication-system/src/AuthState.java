public enum AuthState {
    IDLE,
    AWAITING_PASSWORD,
    AWAITING_TOTP,
    AUTHENTICATED,
    LOCKED_OUT,
    ENROLLMENT;

    public boolean isTerminal() {
        return this == AUTHENTICATED || this == LOCKED_OUT;
    }
}
