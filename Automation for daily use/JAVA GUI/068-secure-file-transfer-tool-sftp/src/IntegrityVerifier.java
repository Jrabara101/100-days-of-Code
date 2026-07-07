import java.io.*;
import java.security.*;
import java.util.zip.CRC32;

/**
 * Post-transfer integrity check strategy.
 *
 * SFTP provides no native checksum command, so we read the local file and
 * compute the digest ourselves.  In a real SFTP implementation we would also
 * request the server-side digest via the vendor-specific
 * "check-file-handle" / "check-file-name" extension (draft-ietf-secsh-filexfer)
 * and compare the two — here we simulate that comparison so the structure is
 * identical to the real protocol.
 */
public class IntegrityVerifier {

    private final ChecksumAlgorithm algorithm;

    public IntegrityVerifier(ChecksumAlgorithm algorithm) {
        this.algorithm = algorithm;
    }

    public ChecksumAlgorithm getAlgorithm() { return algorithm; }

    /**
     * Compute a hex checksum of the given byte array (simulates a local file read).
     * In production this would stream a real file rather than accepting a pre-loaded array.
     */
    public String compute(byte[] data) throws SftpException {
        try {
            if (algorithm == ChecksumAlgorithm.CRC32) {
                CRC32 crc = new CRC32();
                crc.update(data);
                return Long.toHexString(crc.getValue());
            } else {
                MessageDigest md = MessageDigest.getInstance(algorithm.javaName());
                byte[] digest = md.digest(data);
                StringBuilder sb = new StringBuilder();
                for (byte b : digest) sb.append(String.format("%02x", b));
                return sb.toString();
            }
        } catch (NoSuchAlgorithmException e) {
            // All three algorithms are guaranteed present in every JVM; this branch is unreachable.
            throw new TerminalSftpException("JVM missing algorithm: " + algorithm.javaName(), e);
        }
    }

    /**
     * Compare local and remote digests.  Returns true only on an exact match.
     * A mismatch triggers a TerminalSftpException because retrying won't fix
     * a corrupted file — the file must be re-transferred from scratch.
     */
    public void verify(String localChecksum, String remoteChecksum) throws SftpException {
        if (!localChecksum.equalsIgnoreCase(remoteChecksum)) {
            throw new TerminalSftpException(
                String.format("Integrity check FAILED (%s): local=%s remote=%s",
                    algorithm, localChecksum, remoteChecksum));
        }
    }
}
