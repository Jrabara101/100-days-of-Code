/**
 * Base checked exception for all media crypto operations.
 *
 * Using a checked hierarchy forces callers to consciously decide whether to
 * recover from (e.g. wrong password → ask again) or propagate (e.g. corrupt
 * ciphertext → abort) each failure category, rather than letting them collapse
 * into a single RuntimeException catch that silently swallows detail.
 */
public class MediaSecurityException extends Exception {

    public MediaSecurityException(String message) {
        super(message);
    }

    public MediaSecurityException(String message, Throwable cause) {
        super(message, cause);
    }
}
