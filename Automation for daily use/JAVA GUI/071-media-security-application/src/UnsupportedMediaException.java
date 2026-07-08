/**
 * Signals that the selected file's magic bytes don't match any known media type.
 *
 * Distinct from IntegrityViolationException: this fires before any crypto
 * operation begins, purely from header inspection. The security implication is
 * that encrypting an executable (.exe, .dll) or script (.sh, .bat) is blocked
 * by policy — not because the crypto fails, but because this tool is explicitly
 * scoped to media content to prevent accidental misuse as a malware obfuscator.
 */
public class UnsupportedMediaException extends MediaSecurityException {

    private final String detectedSignature;

    public UnsupportedMediaException(String detectedSignature) {
        super("File type not recognized as supported media. " +
              "Detected header signature: " + detectedSignature + ". " +
              "Supported types: JPEG, PNG, GIF, BMP, WebP, MP3, OGG, FLAC, WAV, MP4, AVI, MKV.");
        this.detectedSignature = detectedSignature;
    }

    public String getDetectedSignature() { return detectedSignature; }
}
