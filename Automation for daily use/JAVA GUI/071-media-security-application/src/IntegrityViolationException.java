/**
 * Signals that the HMAC-SHA256 integrity check failed during decryption.
 *
 * This is a terminal failure — the ciphertext has been tampered with or the
 * wrong key was used. The caller must NOT fall back to outputting the partially
 * decrypted bytes; doing so would be worse than failing loudly, because it
 * could expose a partial plaintext to an attacker probing via chosen-ciphertext.
 *
 * Distinguished from a wrong-password failure (which causes AES-GCM tag
 * mismatch at the JCA layer) so the UI can show a clear diagnostic:
 * "Wrong key" vs "File was modified after encryption".
 */
public class IntegrityViolationException extends MediaSecurityException {

    private final String expectedHmac;
    private final String actualHmac;

    public IntegrityViolationException(String expectedHmac, String actualHmac) {
        super(String.format(
            "HMAC integrity check failed — file may have been tampered with. " +
            "Expected: %.16s… Actual: %.16s…", expectedHmac, actualHmac));
        this.expectedHmac = expectedHmac;
        this.actualHmac = actualHmac;
    }

    public String getExpectedHmac() { return expectedHmac; }
    public String getActualHmac()   { return actualHmac; }
}
