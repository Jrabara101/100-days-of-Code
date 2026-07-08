import java.util.Arrays;

/**
 * Classifies a media file by inspecting its leading magic bytes.
 *
 * Each constant encodes the byte pattern that uniquely identifies the format
 * at offset 0 (or a fixed offset for formats like MP4/MOV that place the
 * ftyp box at byte 4). This avoids trusting file extensions, which can be
 * renamed or spoofed — a requirement for a security-focused application.
 */
public enum MediaType {

    JPEG(new byte[]{(byte)0xFF, (byte)0xD8, (byte)0xFF}, 0, "JPEG Image", "jpg"),
    PNG(new byte[]{(byte)0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A}, 0, "PNG Image", "png"),
    GIF(new byte[]{0x47, 0x49, 0x46, 0x38}, 0, "GIF Image", "gif"),
    BMP(new byte[]{0x42, 0x4D}, 0, "BMP Image", "bmp"),
    WEBP(new byte[]{0x57, 0x45, 0x42, 0x50}, 8, "WebP Image", "webp"),   // "WEBP" at offset 8 in RIFF container
    MP3(new byte[]{(byte)0xFF, (byte)0xFB}, 0, "MP3 Audio", "mp3"),
    MP3_ID3(new byte[]{0x49, 0x44, 0x33}, 0, "MP3 Audio (ID3)", "mp3"),
    OGG(new byte[]{0x4F, 0x67, 0x67, 0x53}, 0, "OGG Audio/Video", "ogg"),
    FLAC(new byte[]{0x66, 0x4C, 0x61, 0x43}, 0, "FLAC Audio", "flac"),
    WAV(new byte[]{0x52, 0x49, 0x46, 0x46}, 0, "WAV Audio", "wav"),
    MP4(new byte[]{0x66, 0x74, 0x79, 0x70}, 4, "MP4 Video", "mp4"),      // "ftyp" at offset 4
    AVI(new byte[]{0x52, 0x49, 0x46, 0x46}, 0, "AVI Video", "avi"),
    MKV(new byte[]{0x1A, 0x45, (byte)0xDF, (byte)0xA3}, 0, "MKV Video", "mkv"),
    UNKNOWN(new byte[]{}, 0, "Unknown/Binary", "bin");

    private final byte[] magic;
    private final int offset;
    private final String displayName;
    private final String defaultExtension;

    MediaType(byte[] magic, int offset, String displayName, String defaultExtension) {
        this.magic = magic;
        this.offset = offset;
        this.displayName = displayName;
        this.defaultExtension = defaultExtension;
    }

    public String getDisplayName() { return displayName; }
    public String getDefaultExtension() { return defaultExtension; }

    /**
     * Detects the media type from raw file header bytes.
     *
     * Order matters: WAV and AVI both start with "RIFF", so WAV is checked
     * first; WEBP is a RIFF variant too, checked by its byte-8 marker.
     * UNKNOWN is returned only after all patterns fail.
     */
    public static MediaType detect(byte[] header) {
        if (header == null || header.length < 12) return UNKNOWN;
        for (MediaType mt : values()) {
            if (mt == UNKNOWN || mt.magic.length == 0) continue;
            int end = mt.offset + mt.magic.length;
            if (header.length < end) continue;
            byte[] slice = Arrays.copyOfRange(header, mt.offset, end);
            if (Arrays.equals(slice, mt.magic)) return mt;
        }
        return UNKNOWN;
    }

    public boolean isImage() {
        return this == JPEG || this == PNG || this == GIF || this == BMP || this == WEBP;
    }

    public boolean isAudio() {
        return this == MP3 || this == MP3_ID3 || this == OGG || this == FLAC || this == WAV;
    }

    public boolean isVideo() {
        return this == MP4 || this == AVI || this == MKV || this == OGG;
    }
}
