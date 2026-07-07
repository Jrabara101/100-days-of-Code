/**
 * Supported integrity-verification algorithms ordered by cost vs. collision-resistance.
 *
 * SFTP itself has no mandatory integrity mechanism, so the choice depends on the
 * threat model: CRC32 catches accidental corruption but is trivially faked; MD5 adds
 * cryptographic strength at low cost; SHA256 is the modern baseline that resists
 * length-extension attacks and is required by FIPS-140 environments.
 */
public enum ChecksumAlgorithm {
    CRC32("CRC32", false),
    MD5("MD5", true),
    SHA256("SHA-256", true);

    private final String javaName;
    private final boolean cryptographic;

    ChecksumAlgorithm(String javaName, boolean cryptographic) {
        this.javaName = javaName;
        this.cryptographic = cryptographic;
    }

    public String javaName() { return javaName; }
    public boolean isCryptographic() { return cryptographic; }
}
