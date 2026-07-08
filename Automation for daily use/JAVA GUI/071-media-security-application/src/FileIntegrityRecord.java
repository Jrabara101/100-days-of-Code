import javafx.beans.property.ReadOnlyStringProperty;
import javafx.beans.property.ReadOnlyStringWrapper;
import javafx.beans.property.ReadOnlyLongProperty;
import javafx.beans.property.ReadOnlyLongWrapper;
import javafx.beans.property.ReadOnlyObjectProperty;
import javafx.beans.property.ReadOnlyObjectWrapper;

/**
 * Observable model representing the security metadata of an encrypted file.
 *
 * JavaFX properties expose each field so UI labels can bind directly and
 * update without manual refresh calls — the same pattern as #67's Participant
 * model, applied here to the audit/integrity domain instead of video state.
 */
public class FileIntegrityRecord {

    private final ReadOnlyStringWrapper fileName     = new ReadOnlyStringWrapper();
    private final ReadOnlyLongWrapper   originalSize = new ReadOnlyLongWrapper();
    private final ReadOnlyLongWrapper   encryptedSize= new ReadOnlyLongWrapper();
    private final ReadOnlyStringWrapper hmacSha256   = new ReadOnlyStringWrapper();
    private final ReadOnlyStringWrapper cipherMode   = new ReadOnlyStringWrapper();
    private final ReadOnlyObjectWrapper<MediaType> mediaType =
            new ReadOnlyObjectWrapper<>();
    private final ReadOnlyStringWrapper status       = new ReadOnlyStringWrapper("—");
    private final ReadOnlyStringWrapper errorDetail  = new ReadOnlyStringWrapper("");

    public FileIntegrityRecord(String fileName, long originalSize,
                               MediaType mediaType, CipherProfile profile) {
        this.fileName.set(fileName);
        this.originalSize.set(originalSize);
        this.mediaType.set(mediaType);
        this.cipherMode.set(profile.getDisplayName());
    }

    public void markEncrypted(long encSize, String hmac) {
        this.encryptedSize.set(encSize);
        this.hmacSha256.set(hmac);
        this.status.set("Encrypted");
    }

    public void markDecrypted(long decSize) {
        this.encryptedSize.set(decSize);
        this.status.set("Decrypted");
    }

    public void markFailed(String detail) {
        this.status.set("Failed");
        this.errorDetail.set(detail);
    }

    // Read-only property accessors
    public ReadOnlyStringProperty fileNameProperty()     { return fileName.getReadOnlyProperty(); }
    public ReadOnlyLongProperty   originalSizeProperty() { return originalSize.getReadOnlyProperty(); }
    public ReadOnlyLongProperty   encryptedSizeProperty(){ return encryptedSize.getReadOnlyProperty(); }
    public ReadOnlyStringProperty hmacSha256Property()   { return hmacSha256.getReadOnlyProperty(); }
    public ReadOnlyStringProperty cipherModeProperty()   { return cipherMode.getReadOnlyProperty(); }
    public ReadOnlyObjectProperty<MediaType> mediaTypeProperty() { return mediaType.getReadOnlyProperty(); }
    public ReadOnlyStringProperty statusProperty()       { return status.getReadOnlyProperty(); }
    public ReadOnlyStringProperty errorDetailProperty()  { return errorDetail.getReadOnlyProperty(); }

    public String getFileName()    { return fileName.get(); }
    public MediaType getMediaType(){ return mediaType.get(); }
    public String getStatus()      { return status.get(); }
    public String getHmacSha256()  { return hmacSha256.get(); }
    public long getOriginalSize()  { return originalSize.get(); }
}
