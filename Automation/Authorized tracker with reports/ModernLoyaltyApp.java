import javax.swing.*;
import javax.swing.border.EmptyBorder;
import javax.swing.border.LineBorder;
import javax.swing.border.MatteBorder;
import javax.swing.table.DefaultTableCellRenderer;
import javax.swing.table.DefaultTableModel;
import javax.swing.table.JTableHeader;
import java.awt.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

public class ModernLoyaltyApp extends JFrame {

    // --- DOMAIN LAYER (Type-Safe Types & Immutable Ledgers) ---
    public enum LoyaltyTier {
        BRONZE("Bronze Tier", new Color(180, 83, 9), new BigDecimal("1.0")),    // 1 point per $1
        SILVER("Silver Tier", new Color(71, 85, 105), new BigDecimal("1.2")),   // 1.2 points per $1
        GOLD("Gold Tier", new Color(217, 119, 6), new BigDecimal("1.5")),       // 1.5 points per $1
        PLATINUM("Platinum Tier", new Color(79, 70, 229), new BigDecimal("2.0")); // 2.0 points per $1

        public final String label;
        public final Color color;
        public final BigDecimal multiplier;

        LoyaltyTier(String label, Color color, BigDecimal multiplier) {
            this.label = label;
            this.color = color;
            this.multiplier = multiplier;
        }
    }

    public enum TransactionType { EARNED, REDEEMED }

    public static class LedgerEntry {
        private final String timestamp;
        private final TransactionType type;
        private final BigDecimal cashValue;
        private final int pointsDelta;
        private final String memo;

        public LedgerEntry(TransactionType type, BigDecimal cashValue, int pointsDelta, String memo) {
            this.timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
            this.type = type;
            this.cashValue = cashValue.setScale(2, RoundingMode.HALF_EVEN);
            this.pointsDelta = pointsDelta;
            this.memo = memo;
        }

        public String getTimestamp() { return timestamp; }
        public TransactionType getType() { return type; }
        public BigDecimal getCashValue() { return cashValue; }
        public int getPointsDelta() { return pointsDelta; }
        public String getMemo() { return memo; }
    }

    // --- APPLICATION STATE (Single Source of Truth) ---
    private int currentPointsBalance = 2450;
    private LoyaltyTier currentTier = LoyaltyTier.GOLD;
    private final DefaultTableModel ledgerTableModel;

    // --- VIEW / PRESENTATION COMPONENTS ---
    private JLabel pointsBalanceLabel, tierStatusLabel, cashValueLabel;
    private JComboBox<String> actionSelector;
    private JTextField amountInput, memoInput;
    private JButton commitBtn;
    private JLabel consoleMessageLabel;
    private JTable ledgerTable;

    public ModernLoyaltyApp() {
        setTitle("Horizon Rewards | Central Loyalty Engine");
        setSize(1100, 700);
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setLocationRelativeTo(null); // Center on viewport
        getContentPane().setBackground(new Color(248, 250, 252)); // Slate 50 Base

        // 1. Instantiating Table Data Infrastructure Layer
        String[] columns = {"Timestamp", "Description/Memo", "Transaction Value", "Points Delta"};
        ledgerTableModel = new DefaultTableModel(columns, 0) {
            @Override
            public boolean isCellEditable(int row, int col) { return false; } // Strict read-only view
        };

        setupNativeLookAndFeel();
        initializeWorkspace();
        seedMockData();
    }

    private void setupNativeLookAndFeel() {
        try {
            UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
            // Clear default global font options for clean UI uniformity
            UIManager.put("Label.font", new Font("Segoe UI", Font.PLAIN, 14));
            UIManager.put("Button.font", new Font("Segoe UI", Font.BOLD, 14));
        } catch (Exception ignored) {}
    }

    private void initializeWorkspace() {
        setLayout(new BorderLayout(20, 20));
        ((JPanel) getContentPane()).setBorder(new EmptyBorder(25, 30, 25, 30));

        // Layout Architecture Segregation
        add(buildMetricsHeaderPanel(), BorderLayout.NORTH);
        add(buildCentralLedgerGrid(), BorderLayout.CENTER);
        add(buildControlSidebarForm(), BorderLayout.WEST);
    }

    // --- VIEW ARCHITECTURE MODULES ---

    private JPanel buildMetricsHeaderPanel() {
        JPanel dashboardRow = new JPanel(new GridLayout(1, 3, 20, 0));
        dashboardRow.setOpaque(false);

        // Card 1: Balance Tracker
        pointsBalanceLabel = new JLabel("0");
        dashboardRow.add(createKPICard("Total Active Balance", pointsBalanceLabel, new Color(79, 70, 229)));

        // Card 2: Tier Rank
        tierStatusLabel = new JLabel("Bronze");
        dashboardRow.add(createKPICard("Loyalty Classification Status", tierStatusLabel, currentTier.color));

        // Card 3: Cash Redemption Value
        cashValueLabel = new JLabel("$0.00");
        dashboardRow.add(createKPICard("Est. Capital Redeemable Value", cashValueLabel, new Color(16, 185, 129)));

        updateDashboardMetrics();
        return dashboardRow;
    }

    private JPanel createKPICard(String title, JLabel valueLabel, Color accentColor) {
        JPanel card = new JPanel(new BorderLayout(0, 8));
        card.setBackground(Color.WHITE);
        card.setBorder(BorderFactory.createCompoundBorder(
                new LineBorder(new Color(226, 232, 240), 1, true), // Slate 200
                new EmptyBorder(20, 20, 20, 20)
        ));

        JLabel metaLabel = new JLabel(title.toUpperCase());
        metaLabel.setFont(new Font("Segoe UI", Font.BOLD, 11));
        metaLabel.setForeground(new Color(148, 163, 184)); // Slate 400

        valueLabel.setFont(new Font("Segoe UI", Font.BOLD, 32));
        valueLabel.setForeground(accentColor);

        // Visual design token: Top border stripe mirroring state tracking accents
        card.setBorder(BorderFactory.createCompoundBorder(
                new MatteBorder(4, 0, 0, 0, accentColor),
                new EmptyBorder(16, 20, 20, 20)
        ));

        card.add(metaLabel, BorderLayout.NORTH);
        card.add(valueLabel, BorderLayout.CENTER);
        return card;
    }

    private JPanel buildCentralLedgerGrid() {
        JPanel panel = new JPanel(new BorderLayout(0, 15));
        panel.setOpaque(false);

        JLabel title = new LabelWrapper("Immutable Rewards Audit Ledger", 18, Font.BOLD, new Color(15, 23, 42));
        
        ledgerTable = new JTable(ledgerTableModel);
        ledgerTable.setRowHeight(38);
        ledgerTable.setFont(new Font("Segoe UI", Font.PLAIN, 14));
        ledgerTable.setShowGrid(false);
        ledgerTable.setIntercellSpacing(new Dimension(0, 0));
        ledgerTable.setSelectionBackground(new Color(238, 242, 255)); // Indigo 50
        ledgerTable.setSelectionForeground(new Color(15, 23, 42));

        // Custom Header Formats
        JTableHeader header = ledgerTable.getTableHeader();
        header.setFont(new Font("Segoe UI", Font.BOLD, 13));
        header.setBackground(new Color(241, 245, 249)); // Slate 100
        header.setForeground(new Color(71, 85, 105));   // Slate 600
        header.setPreferredSize(new Dimension(0, 38));
        header.setBorder(new MatteBorder(0, 0, 1, 0, new Color(226, 232, 240)));

        // Mount Advanced Contextual Column Renders
        setupTableRenderPipelines();

        JScrollPane scrollPane = new JScrollPane(ledgerTable);
        scrollPane.getViewport().setBackground(Color.WHITE);
        scrollPane.setBorder(new LineBorder(new Color(226, 232, 240), 1, true));

        panel.add(title, BorderLayout.NORTH);
        panel.add(scrollPane, BorderLayout.CENTER);
        return panel;
    }

    private JPanel buildControlSidebarForm() {
        JPanel sidebar = new JPanel(new GridBagLayout());
        sidebar.setBackground(Color.WHITE);
        sidebar.setBorder(BorderFactory.createCompoundBorder(
                new LineBorder(new Color(226, 232, 240), 1, true),
                new EmptyBorder(25, 20, 25, 20)
        ));
        sidebar.setPreferredSize(new Dimension(340, 0));

        GridBagConstraints gbc = new GridBagConstraints();
        gbc.fill = GridBagConstraints.HORIZONTAL;
        gbc.gridx = 0;
        gbc.weightx = 1.0;
        gbc.insets = new Insets(0, 0, 6, 0);

        gbc.gridy = 0;
        sidebar.add(new LabelWrapper("Transaction Pipeline Engine", 16, Font.BOLD, new Color(51, 65, 85)), gbc);

        gbc.gridy = 1; gbc.insets = new Insets(15, 0, 4, 0);
        sidebar.add(new LabelWrapper("Operation Profile Type", 12, Font.BOLD, new Color(100, 116, 139)), gbc);
        
        gbc.gridy = 2; gbc.insets = new Insets(0, 0, 15, 0);
        actionSelector = new JComboBox<>(new String[]{"Register Sale / Earn Points", "Redeem Rewards Balance"});
        actionSelector.setPreferredSize(new Dimension(0, 38));
        sidebar.add(actionSelector, gbc);

        gbc.gridy = 3;
        sidebar.add(new LabelWrapper("Transaction Gross Amount ($)", 12, Font.BOLD, new Color(100, 116, 139)), gbc);

        gbc.gridy = 4; gbc.insets = new Insets(0, 0, 15, 0);
        amountInput = new JTextField();
        styleTextInput(amountInput);
        sidebar.add(amountInput, gbc);

        gbc.gridy = 5;
        sidebar.add(new LabelWrapper("Operational Reference Memo", 12, Font.BOLD, new Color(100, 116, 139)), gbc);

        gbc.gridy = 6; gbc.insets = new Insets(0, 0, 25, 0);
        memoInput = new JTextField();
        styleTextInput(memoInput);
        sidebar.add(memoInput, gbc);

        gbc.gridy = 7;
        commitBtn = new JButton("Execute Business Logs");
        commitBtn.setBackground(new Color(79, 70, 229)); // Indigo 600
        commitBtn.setForeground(Color.WHITE);
        commitBtn.setOpaque(true);
        commitBtn.setBorderPainted(false);
        commitBtn.setFocusPainted(false);
        commitBtn.setPreferredSize(new Dimension(0, 44));
        commitBtn.setCursor(new Cursor(Cursor.HAND_CURSOR));
        commitBtn.addActionListener(e -> processTransactionExecutionPipeline());
        sidebar.add(commitBtn, gbc);

        // Continuous Spacer constraint component pushing console downwards
        gbc.gridy = 8; gbc.weighty = 1.0;
        sidebar.add(Box.createVerticalGlue(), gbc);

        gbc.gridy = 9; gbc.weighty = 0.0; gbc.insets = new Insets(10, 0, 0, 0);
        consoleMessageLabel = new LabelWrapper("Engine State: Operational Base Calibrated.", 12, Font.PLAIN, new Color(100, 116, 139));
        sidebar.add(consoleMessageLabel, gbc);

        return sidebar;
    }

    private void styleTextInput(JTextField field) {
        field.setPreferredSize(new Dimension(0, 38));
        field.setFont(new Font("Segoe UI", Font.PLAIN, 14));
        field.setBorder(BorderFactory.createCompoundBorder(
                new LineBorder(new Color(203, 213, 225), 1, true),
                new EmptyBorder(0, 10, 0, 10)
        ));
    }

    private void setupTableRenderPipelines() {
        // Base aligned default string cell format layout template rules
        DefaultTableCellRenderer baselineTextRenderer = new DefaultTableCellRenderer() {
            @Override
            public Component getTableCellRendererComponent(JTable table, Object val, boolean isSel, boolean hasFocus, int r, int c) {
                Component cellComp = super.getTableCellRendererComponent(table, val, isSel, hasFocus, r, c);
                setBorder(noFocusBorder);
                if (!isSel) {
                    cellComp.setForeground(new Color(51, 65, 85));
                    setBackground(r % 2 == 0 ? Color.WHITE : new Color(248, 250, 252)); // Alternating row strips
                }
                return cellComp;
            }
        };

        ledgerTable.getColumnModel().getColumn(0).setCellRenderer(baselineTextRenderer);
        ledgerTable.getColumnModel().getColumn(1).setCellRenderer(baselineTextRenderer);

        // Numeric Financial Cell Data Processing pipeline
        ledgerTable.getColumnModel().getColumn(2).setCellRenderer(new DefaultTableCellRenderer() {
            @Override
            public Component getTableCellRendererComponent(JTable table, Object val, boolean isSel, boolean hasFocus, int r, int c) {
                Component comp = super.getTableCellRendererComponent(table, val, isSel, hasFocus, r, c);
                setHorizontalAlignment(SwingConstants.RIGHT);
                setBorder(noFocusBorder);
                if (val instanceof BigDecimal) {
                    setText(NumberFormat.getCurrencyInstance(Locale.US).format(val));
                }
                return comp;
            }
        });

        // Points Delta Color Context Status Badge Engine
        ledgerTable.getColumnModel().getColumn(3).setCellRenderer(new DefaultTableCellRenderer() {
            @Override
            public Component getTableCellRendererComponent(JTable table, Object val, boolean isSel, boolean hasFocus, int r, int c) {
                Component comp = super.getTableCellRendererComponent(table, val, isSel, hasFocus, r, c);
                setHorizontalAlignment(SwingConstants.RIGHT);
                setFont(new Font("Segoe UI", Font.BOLD, 14));
                setBorder(noFocusBorder);

                String textStr = (val != null) ? val.toString() : "";
                if (textStr.startsWith("+")) {
                    setForeground(new Color(5, 150, 105)); // Emerald 600
                } else if (textStr.startsWith("-")) {
                    setForeground(new Color(220, 38, 38)); // Red 600
                }
                return comp;
            }
        });
    }

    // --- ARCHITECTURAL CONTROLLER ENGINE LOGIC ---

    private void processTransactionExecutionPipeline() {
        String rawValueStr = amountInput.getText().trim().replaceAll("[^\\d.]", "");
        String memoStr = memoInput.getText().trim();
        int activeSelectionIdx = actionSelector.getSelectedIndex();

        if (rawValueStr.isEmpty()) {
            dispatchConsoleFeedback("Validation Error: Numerical values missing.", true);
            return;
        }

        BigDecimal cashTransactionValue;
        try {
            cashTransactionValue = new BigDecimal(rawValueStr);
            if (cashTransactionValue.compareTo(BigDecimal.ZERO) <= 0) throw new NumberFormatException();
        } catch (NumberFormatException ex) {
            dispatchConsoleFeedback("Validation Error: Value criteria constraint violated.", true);
            return;
        }

        if (memoStr.isEmpty()) {
            memoStr = activeSelectionIdx == 0 ? "Standard Customer Acquisition" : "Loyalty Store Redemption Bundle";
        }

        // Lock UI control parameters to neutralize thread race collision loops
        commitBtn.setEnabled(false);
        dispatchConsoleFeedback("Streaming encrypted ledger data blocks down to database layer...", false);

        final String finalMemo = memoStr;
        
        // Concurrency Guard: Offload data persistence overhead safely off the EDT via SwingWorker
        SwingWorker<LedgerEntry, Void> operationalWorker = new SwingWorker<>() {
            @Override
            protected LedgerEntry doInBackground() throws Exception {
                Thread.sleep(1200); // Simulate network latency/disk file sync loops

                if (activeSelectionIdx == 0) {
                    // Earn Points: Multiplication engine run against cash metrics
                    int earnedPoints = cashTransactionValue.multiply(currentTier.multiplier).intValue();
                    return new LedgerEntry(TransactionType.EARNED, cashTransactionValue, earnedPoints, finalMemo);
                } else {
                    // Redeem Rewards Balance: Conversion math calculation mapping 10 points = $1 cash value redemption
                    int structuralPointsCost = cashTransactionValue.multiply(new BigDecimal("10")).intValue();
                    return new LedgerEntry(TransactionType.REDEEMED, cashTransactionValue, structuralPointsCost, finalMemo);
                }
            }

            @Override
            protected void done() {
                try {
                    LedgerEntry entry = get();
                    
                    // Business validation processing checks executed on state metrics
                    if (entry.getType() == TransactionType.REDEEMED && currentPointsBalance < entry.getPointsDelta()) {
                        dispatchConsoleFeedback("Transaction Aborted: Insufficient point metrics.", true);
                    } else {
                        commitLedgerEntryToState(entry);
                        dispatchConsoleFeedback("Ledger Commit Success: Ledger logs persistent.", false);
                        clearFormInputs();
                    }
                } catch (Exception ex) {
                    dispatchConsoleFeedback("System Error: Critical persistence thread loop mutation fault.", true);
                } finally {
                    commitBtn.setEnabled(true);
                }
            }
        };

        operationalWorker.execute();
    }

    private void commitLedgerEntryToState(LedgerEntry entry) {
        if (entry.getType() == TransactionType.EARNED) {
            currentPointsBalance += entry.getPointsDelta();
            ledgerTableModel.insertRow(0, new Object[]{
                    entry.getTimestamp(), entry.getMemo(), entry.getCashValue(), "+" + entry.getPointsDelta()
            });
        } else {
            currentPointsBalance -= entry.getPointsDelta();
            ledgerTableModel.insertRow(0, new Object[]{
                    entry.getTimestamp(), entry.getMemo(), entry.getCashValue(), "-" + entry.getPointsDelta()
            });
        }

        evaluateAndMutateLoyaltyTierState();
        updateDashboardMetrics();
    }

    private void evaluateAndMutateLoyaltyTierState() {
        // Business Rule Hierarchy evaluation mapping
        if (currentPointsBalance >= 5000) currentTier = LoyaltyTier.PLATINUM;
        else if (currentPointsBalance >= 2500) currentTier = LoyaltyTier.GOLD;
        else if (currentPointsBalance >= 1000) currentTier = LoyaltyTier.SILVER;
        else currentTier = LoyaltyTier.BRONZE;
    }

    private void updateDashboardMetrics() {
        pointsBalanceLabel.setText(String.format("%,d", currentPointsBalance));
        tierStatusLabel.setText(currentTier.label);
        
        // Re-calculate Accent Color mappings dynamically based on current tier properties
        if (tierStatusLabel.getParent() instanceof JComponent) {
            ((JComponent) tierStatusLabel.getParent()).setBorder(BorderFactory.createCompoundBorder(
                    new MatteBorder(4, 0, 0, 0, currentTier.color),
                    new EmptyBorder(16, 20, 20, 20)
            ));
        }
        tierStatusLabel.setForeground(currentTier.color);

        // Point value formulation translation: 100 points matches a unified standard dividend value of $1.00
        BigDecimal dividendCashConversionValue = BigDecimal.valueOf(currentPointsBalance)
                .divide(new BigDecimal("100"), 2, RoundingMode.HALF_EVEN);
        cashValueLabel.setText(NumberFormat.getCurrencyInstance(Locale.US).format(dividendCashConversionValue));
    }

    private void clearFormInputs() {
        amountInput.setText("");
        memoInput.setText("");
    }

    private void dispatchConsoleFeedback(String msg, boolean flagsErrorCondition) {
        consoleMessageLabel.setText("Engine Log: " + msg);
        consoleMessageLabel.setForeground(flagsErrorCondition ? new Color(220, 38, 38) : new Color(5, 150, 105));
    }

    private void seedMockData() {
        commitLedgerEntryToState(new LedgerEntry(TransactionType.EARNED, new BigDecimal("1200.00"), 1200, "Corporate Account Baseline Acquisition"));
        commitLedgerEntryToState(new LedgerEntry(TransactionType.EARNED, new BigDecimal("500.50"), 750, "Hardware Components Liquidation Sale"));
        commitLedgerEntryToState(new LedgerEntry(TransactionType.REDEEMED, new BigDecimal("50.00"), 500, "Enterprise Suite License Credit Rebate"));
    }

    // Custom Label Wrapper minimizing redundant font instantiation overhead
    private static class LabelWrapper extends JLabel {
        public LabelWrapper(String txt, int size, int designWeight, Color designColor) {
            super(txt);
            setFont(new Font("Segoe UI", designWeight, size));
            setForeground(designColor);
        }
    }

    public static void main(String[] args) {
        // Enforce execution on the dedicated Event Dispatch Thread (EDT)
        SwingUtilities.invokeLater(() -> new ModernLoyaltyApp().setVisible(true));
    }
}
