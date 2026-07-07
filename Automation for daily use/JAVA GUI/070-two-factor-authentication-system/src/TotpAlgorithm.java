import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;

/**
 * RFC 6238 TOTP implementation.
 *
 * Core reasoning: TOTP derives a 6-digit OTP from HMAC-SHA1(secret, counter)
 * where counter = floor(unix_epoch / 30). Because device clocks drift, we
 * accept codes from the previous and next 30-second window too (drift_windows=1),
 * giving a 90-second validity span. Wider acceptance windows reduce security;
 * narrower windows hurt UX on devices with slight clock skew — ±1 window is
 * the standard RFC 6238 recommendation and is used by Google Authenticator.
 *
 * Dynamic truncation (the last nibble of the HMAC selects the 4-byte offset)
 * is the official RFC 4226 / RFC 6238 technique; we implement it faithfully.
 */
public final class TotpAlgorithm {

    private static final int TOTP_PERIOD_SECONDS = 30;
    private static final int DRIFT_WINDOWS = 1;
    private static final int CODE_DIGITS = 6;
    private static final int[] DIGIT_POWER = {
        1, 10, 100, 1_000, 10_000, 100_000, 1_000_000
    };

    private TotpAlgorithm() {}

    /** Generate a cryptographically random 20-byte (160-bit) base32 secret. */
    public static String generateSecret() {
        byte[] raw = new byte[20];
        new SecureRandom().nextBytes(raw);
        return base32Encode(raw);
    }

    /**
     * Verify a 6-digit code against the given secret and current server time.
     *
     * @return the matching time-step counter if valid, or -1 if no window matched
     */
    public static long verify(String base32Secret, String code, long epochSeconds) {
        if (code == null || !code.matches("\\d{6}")) {
            return -1;
        }
        int submitted = Integer.parseInt(code);
        long currentStep = epochSeconds / TOTP_PERIOD_SECONDS;
        byte[] key = base32Decode(base32Secret);

        for (int delta = -DRIFT_WINDOWS; delta <= DRIFT_WINDOWS; delta++) {
            long step = currentStep + delta;
            if (generateCode(key, step) == submitted) {
                return step;
            }
        }
        return -1;
    }

    /** Generate the current OTP for display / testing purposes. */
    public static String currentCode(String base32Secret) {
        byte[] key = base32Decode(base32Secret);
        long step = Instant.now().getEpochSecond() / TOTP_PERIOD_SECONDS;
        int code = generateCode(key, step);
        return String.format("%0" + CODE_DIGITS + "d", code);
    }

    /** Seconds remaining in the current 30-second window. */
    public static int secondsUntilNextWindow() {
        return (int) (TOTP_PERIOD_SECONDS - (Instant.now().getEpochSecond() % TOTP_PERIOD_SECONDS));
    }

    // RFC 4226 HOTP: HMAC-SHA1(K, C) + dynamic truncation
    private static int generateCode(byte[] key, long counter) {
        try {
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(key, "HmacSHA1"));
            byte[] counterBytes = ByteBuffer.allocate(8).putLong(counter).array();
            byte[] hash = mac.doFinal(counterBytes);

            // Dynamic truncation: offset = last nibble of hash
            int offset = hash[hash.length - 1] & 0x0F;
            int truncated = ((hash[offset] & 0x7F) << 24)
                          | ((hash[offset + 1] & 0xFF) << 16)
                          | ((hash[offset + 2] & 0xFF) << 8)
                          |  (hash[offset + 3] & 0xFF);

            return truncated % DIGIT_POWER[CODE_DIGITS];
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new IllegalStateException("HmacSHA1 unavailable", e);
        }
    }

    // Base32 encoding (RFC 4648, no padding variant for readability)
    private static final String BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

    static String base32Encode(byte[] data) {
        StringBuilder sb = new StringBuilder();
        int buffer = 0, bitsLeft = 0;
        for (byte b : data) {
            buffer = (buffer << 8) | (b & 0xFF);
            bitsLeft += 8;
            while (bitsLeft >= 5) {
                bitsLeft -= 5;
                sb.append(BASE32_CHARS.charAt((buffer >> bitsLeft) & 0x1F));
            }
        }
        if (bitsLeft > 0) {
            sb.append(BASE32_CHARS.charAt((buffer << (5 - bitsLeft)) & 0x1F));
        }
        return sb.toString();
    }

    static byte[] base32Decode(String encoded) {
        String upper = encoded.toUpperCase().replaceAll("[^A-Z2-7]", "");
        byte[] output = new byte[upper.length() * 5 / 8];
        int buffer = 0, bitsLeft = 0, idx = 0;
        for (char c : upper.toCharArray()) {
            buffer = (buffer << 5) | BASE32_CHARS.indexOf(c);
            bitsLeft += 5;
            if (bitsLeft >= 8) {
                bitsLeft -= 8;
                output[idx++] = (byte) ((buffer >> bitsLeft) & 0xFF);
            }
        }
        return output;
    }
}
