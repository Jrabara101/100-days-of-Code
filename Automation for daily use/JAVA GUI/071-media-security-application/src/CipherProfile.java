/**
 * Encodes the cipher-mode reasoning specific to media file security.
 *
 * The choice of AES mode is non-trivial for media:
 * - AES-GCM (authenticated encryption) is ideal for small files where the
 *   entire ciphertext can be buffered in memory before the auth tag is checked.
 *   It provides confidentiality + integrity in one pass but requires the full
 *   ciphertext to validate the 128-bit tag at the end — unsuitable for streaming.
 * - AES-CTR (counter mode) turns AES into a stream cipher: no padding required,
 *   each 16-byte block is independent, so arbitrarily large files can be encrypted
 *   chunk-by-chunk without buffering everything. Integrity is provided separately
 *   via HMAC-SHA256 prepended to the encrypted output.
 * - AES-CBC is excluded: it adds PKCS#5 padding (corrupts bitstream of audio/video
 *   that relies on specific byte lengths) and is vulnerable to padding-oracle attacks
 *   unless combined with Encrypt-then-MAC — CTR avoids both problems.
 *
 * The size threshold (4 MB) is a pragmatic balance: at 4 MB a GCM buffer fits
 * comfortably in the JVM heap without GC pressure, and most image/thumbnail files
 * are well below this limit. Video files almost always exceed it.
 */
public enum CipherProfile {

    GCM_AUTHENTICATED(
        "AES/GCM/NoPadding",
        "AES-GCM",
        "Authenticated (GCM)",
        "Single-pass encrypt+authenticate. Ideal for files <= 4 MB. " +
        "Full ciphertext buffered; 128-bit auth tag verifies integrity atomically.",
        4 * 1024 * 1024L   // 4 MB threshold
    ),

    CTR_STREAM(
        "AES/CTR/NoPadding",
        "AES-CTR",
        "Streaming (CTR + HMAC)",
        "Block-independent counter mode. No padding, no buffering. " +
        "Integrity provided by a separate HMAC-SHA256 prepended header. " +
        "Required for files > 4 MB to avoid OOM on large video.",
        Long.MAX_VALUE
    );

    private final String jceName;
    private final String shortName;
    private final String displayName;
    private final String rationale;
    private final long maxFileSizeBytes;

    CipherProfile(String jceName, String shortName, String displayName,
                  String rationale, long maxFileSizeBytes) {
        this.jceName = jceName;
        this.shortName = shortName;
        this.displayName = displayName;
        this.rationale = rationale;
        this.maxFileSizeBytes = maxFileSizeBytes;
    }

    public String getJceName()      { return jceName; }
    public String getShortName()    { return shortName; }
    public String getDisplayName()  { return displayName; }
    public String getRationale()    { return rationale; }

    /**
     * Selects the appropriate cipher profile given a file's size and type.
     *
     * Video files skip GCM regardless of size, because even a short clip
     * can be tens of megabytes and the buffering cost is too high.
     */
    public static CipherProfile selectFor(long fileSizeBytes, MediaType type) {
        if (type.isVideo()) return CTR_STREAM;
        if (fileSizeBytes <= GCM_AUTHENTICATED.maxFileSizeBytes) return GCM_AUTHENTICATED;
        return CTR_STREAM;
    }
}
