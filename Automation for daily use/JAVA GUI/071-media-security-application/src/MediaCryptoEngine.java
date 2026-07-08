import javax.crypto.*;
import javax.crypto.spec.*;
import java.io.*;
import java.nio.file.*;
import java.security.*;
import java.util.Arrays;
import java.util.HexFormat;

/**
 * Core encryption/decryption engine for media files.
 *
 * Encrypted file format (little-endian):
 *   [4 bytes] magic marker: 0x4D534543 ("MSEC")
 *   [1 byte]  cipher profile ordinal (0=GCM, 1=CTR)
 *   [4 bytes] media type ordinal
 *   [8 bytes] original file size (long)
 *   [32 bytes] HMAC-SHA256 of (plaintext) — always present regardless of mode
 *   [16 bytes] IV/nonce (AES block size)
 *   [variable] ciphertext
 *
 * HMAC is computed over the original plaintext and stored in the header,
 * providing an integrity check that survives the CTR stream without needing
 * to buffer the entire ciphertext. For GCM, the JCA auth tag also guards
 * the ciphertext, giving double assurance; the HMAC remains so decryption
 * code has a single integrity path regardless of mode.
 */
public class MediaCryptoEngine {

    private static final byte[] MAGIC = {0x4D, 0x53, 0x45, 0x43};  // "MSEC"
    private static final int CHUNK_SIZE = 64 * 1024;                 // 64 KB read chunks
    private static final int GCM_TAG_LENGTH = 128;                   // GCM auth-tag bits
    private static final String HMAC_ALGO = "HmacSHA256";
    private static final String KEY_ALGO  = "AES";

    private final SecureRandom rng = new SecureRandom();

    /**
     * Derives a 256-bit AES key from a password using PBKDF2-HMAC-SHA256.
     *
     * 310,000 iterations follows NIST SP 800-132 and OWASP 2023 guidance for
     * PBKDF2-SHA256 (chosen over bcrypt/Argon2 for JCA built-in availability
     * without extra dependencies). The salt is stored separately by the caller.
     */
    public SecretKey deriveKey(char[] password, byte[] salt)
            throws MediaSecurityException {
        try {
            PBEKeySpec spec = new PBEKeySpec(password, salt, 310_000, 256);
            SecretKeyFactory skf = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
            byte[] raw = skf.generateSecret(spec).getEncoded();
            spec.clearPassword();
            return new SecretKeySpec(raw, KEY_ALGO);
        } catch (Exception e) {
            throw new MediaSecurityException("Key derivation failed", e);
        }
    }

    /**
     * Encrypts inputFile → outputFile using the profile appropriate for its size and type.
     *
     * Returns a FileIntegrityRecord populated with the HMAC and cipher metadata.
     */
    public FileIntegrityRecord encrypt(File inputFile, File outputFile,
                                       SecretKey key)
            throws MediaSecurityException, IOException {
        byte[] header = readHeader(inputFile, 16);
        MediaType mediaType = MediaType.detect(header);

        if (mediaType == MediaType.UNKNOWN) {
            String sig = HexFormat.of().formatHex(Arrays.copyOf(header, Math.min(8, header.length)));
            throw new UnsupportedMediaException(sig);
        }

        long fileSize = inputFile.length();
        CipherProfile profile = CipherProfile.selectFor(fileSize, mediaType);
        FileIntegrityRecord record = new FileIntegrityRecord(
                inputFile.getName(), fileSize, mediaType, profile);

        // Compute HMAC over plaintext before encrypting
        String hmac = computeHmac(inputFile, key);

        byte[] iv = new byte[16];
        rng.nextBytes(iv);

        try (InputStream in  = new BufferedInputStream(new FileInputStream(inputFile), CHUNK_SIZE);
             OutputStream out = new BufferedOutputStream(new FileOutputStream(outputFile), CHUNK_SIZE)) {

            // Write our file header
            out.write(MAGIC);
            out.write(profile.ordinal());
            writeInt(out, mediaType.ordinal());
            writeLong(out, fileSize);
            out.write(HexFormat.of().parseHex(hmac));  // 32 bytes
            out.write(iv);

            Cipher cipher = buildCipher(profile, key, iv, Cipher.ENCRYPT_MODE);
            streamCipher(in, out, cipher);
        } catch (Exception e) {
            throw new MediaSecurityException("Encryption failed: " + e.getMessage(), e);
        }

        record.markEncrypted(outputFile.length(), hmac);
        return record;
    }

    /**
     * Decrypts inputFile → outputFile, verifying the HMAC after decryption.
     *
     * Throws IntegrityViolationException if the HMAC of decrypted output
     * doesn't match the stored header value — indicating tampering or key mismatch.
     */
    public FileIntegrityRecord decrypt(File inputFile, File outputFile,
                                       SecretKey key)
            throws MediaSecurityException, IOException {
        try (DataInputStream din = new DataInputStream(
                new BufferedInputStream(new FileInputStream(inputFile), CHUNK_SIZE))) {

            // Parse and validate our header
            byte[] magic = din.readNBytes(4);
            if (!Arrays.equals(magic, MAGIC)) {
                throw new MediaSecurityException(
                    "Not a valid MSEC encrypted file — missing magic header. " +
                    "This file was not encrypted by Media Security Application.");
            }

            int profileOrdinal   = din.readByte() & 0xFF;
            int mediaTypeOrdinal = readInt(din);
            long originalSize    = din.readLong();
            byte[] storedHmacBytes = din.readNBytes(32);
            String storedHmac    = HexFormat.of().formatHex(storedHmacBytes);
            byte[] iv            = din.readNBytes(16);

            CipherProfile profile  = CipherProfile.values()[profileOrdinal];
            MediaType mediaType    = MediaType.values()[mediaTypeOrdinal];

            FileIntegrityRecord record = new FileIntegrityRecord(
                    inputFile.getName(), originalSize, mediaType, profile);

            Cipher cipher = buildCipher(profile, key, iv, Cipher.DECRYPT_MODE);

            // Decrypt to a temp file, then verify HMAC before finalizing
            File tempOut = new File(outputFile.getParent(),
                    ".$tmp_" + outputFile.getName());
            try {
                try (OutputStream tmpStream = new BufferedOutputStream(
                        new FileOutputStream(tempOut), CHUNK_SIZE)) {
                    streamCipher(din, tmpStream, cipher);
                }

                // Verify integrity after decryption
                String actualHmac = computeHmac(tempOut, key);
                if (!MessageDigest.isEqual(
                        HexFormat.of().parseHex(storedHmac),
                        HexFormat.of().parseHex(actualHmac))) {
                    throw new IntegrityViolationException(storedHmac, actualHmac);
                }

                // Atomic rename only after integrity confirmed
                Files.move(tempOut.toPath(), outputFile.toPath(),
                        StandardCopyOption.REPLACE_EXISTING);
            } finally {
                if (tempOut.exists()) tempOut.delete();
            }

            record.markDecrypted(outputFile.length());
            return record;

        } catch (MediaSecurityException e) {
            throw e;
        } catch (Exception e) {
            throw new MediaSecurityException("Decryption failed: " + e.getMessage(), e);
        }
    }

    // -- Private helpers --

    private Cipher buildCipher(CipherProfile profile, SecretKey key,
                                byte[] iv, int mode) throws Exception {
        Cipher cipher = Cipher.getInstance(profile.getJceName());
        if (profile == CipherProfile.GCM_AUTHENTICATED) {
            cipher.init(mode, key, new GCMParameterSpec(GCM_TAG_LENGTH, iv));
        } else {
            cipher.init(mode, key, new IvParameterSpec(iv));
        }
        return cipher;
    }

    private void streamCipher(InputStream in, OutputStream out, Cipher cipher)
            throws Exception {
        byte[] buf = new byte[CHUNK_SIZE];
        int read;
        while ((read = in.read(buf)) != -1) {
            byte[] enc = cipher.update(buf, 0, read);
            if (enc != null) out.write(enc);
        }
        byte[] final_ = cipher.doFinal();
        if (final_ != null) out.write(final_);
    }

    private String computeHmac(File file, SecretKey key)
            throws MediaSecurityException {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGO);
            mac.init(new SecretKeySpec(key.getEncoded(), HMAC_ALGO));
            byte[] buf = new byte[CHUNK_SIZE];
            try (InputStream in = new BufferedInputStream(new FileInputStream(file), CHUNK_SIZE)) {
                int read;
                while ((read = in.read(buf)) != -1) {
                    mac.update(buf, 0, read);
                }
            }
            return HexFormat.of().formatHex(mac.doFinal());
        } catch (Exception e) {
            throw new MediaSecurityException("HMAC computation failed", e);
        }
    }

    private byte[] readHeader(File f, int n) throws IOException {
        try (InputStream in = new FileInputStream(f)) {
            return in.readNBytes(n);
        }
    }

    private void writeInt(OutputStream out, int v) throws IOException {
        out.write((v >> 24) & 0xFF);
        out.write((v >> 16) & 0xFF);
        out.write((v >>  8) & 0xFF);
        out.write( v        & 0xFF);
    }

    private void writeLong(OutputStream out, long v) throws IOException {
        for (int i = 56; i >= 0; i -= 8) out.write((int)((v >> i) & 0xFF));
    }

    private int readInt(DataInputStream in) throws IOException {
        return ((in.readByte() & 0xFF) << 24) | ((in.readByte() & 0xFF) << 16) |
               ((in.readByte() & 0xFF) << 8)  |  (in.readByte() & 0xFF);
    }
}
