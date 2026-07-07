import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import java.util.Optional;

/**
 * In-memory account registry backed by an ObservableList so the UI can watch
 * for new registrations and enrollment changes without polling.
 */
public class AccountStore {

    private final ObservableList<TotpSecret> accounts =
            FXCollections.observableArrayList();

    public AccountStore() {
        // Seed a demo account: username="admin", password="secret123"
        TotpSecret demo = new TotpSecret("admin", TotpSecret.hashPassword("secret123"));
        String demoTotpSecret = TotpAlgorithm.generateSecret();
        demo.enroll(demoTotpSecret);
        accounts.add(demo);
    }

    public ObservableList<TotpSecret> getAccounts() {
        return accounts;
    }

    public Optional<TotpSecret> findByUsername(String username) {
        return accounts.stream()
                .filter(a -> a.getUsername().equalsIgnoreCase(username))
                .findFirst();
    }

    public boolean usernameExists(String username) {
        return findByUsername(username).isPresent();
    }

    public TotpSecret register(String username, String rawPassword) {
        if (usernameExists(username)) {
            throw new IllegalArgumentException("Username already taken: " + username);
        }
        TotpSecret account = new TotpSecret(username, TotpSecret.hashPassword(rawPassword));
        accounts.add(account);
        return account;
    }
}
