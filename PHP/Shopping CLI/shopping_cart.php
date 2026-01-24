<?php
session_start();

class ShoppingCart {
    private const DISCOUNT_THRESHOLD = 100;
    private const DISCOUNT_RATE = 0.10;
    private const SESSION_KEY = 'shopping_cart';

    public function __construct() {
        if (!isset($_SESSION[self::SESSION_KEY])) {
            $_SESSION[self::SESSION_KEY] = [];
        }
    }

    public function addItem($itemName, $price, $quantity = 1) {
        $itemName = trim($itemName);
        $price = (float)$price;
        $quantity = max(1, (int)$quantity);

        if (empty($itemName) || $price < 0) {
            return false;
        }

        $cart = &$_SESSION[self::SESSION_KEY];

        if (isset($cart[$itemName])) {
            $cart[$itemName]['quantity'] += $quantity;
        } else {
            $cart[$itemName] = [
                'price' => $price,
                'quantity' => $quantity
            ];
        }
        return true;
    }

    public function removeItem($itemName) {
        $itemName = trim($itemName);
        if (isset($_SESSION[self::SESSION_KEY][$itemName])) {
            unset($_SESSION[self::SESSION_KEY][$itemName]);
            return true;
        }
        return false;
    }

    public function calculateTotal() {
        $cart = $_SESSION[self::SESSION_KEY];
        $subtotal = 0;

        foreach ($cart as $item) {
            $subtotal += $item['price'] * $item['quantity'];
        }

        $discount = 0;
        if ($subtotal > self::DISCOUNT_THRESHOLD) {
            $discount = $subtotal * self::DISCOUNT_RATE;
        }

        return [
            'subtotal' => $subtotal,
            'discount' => $discount,
            'total' => $subtotal - $discount,
            'discounted' => $discount > 0
        ];
    }

    public function getCart() {
        return $_SESSION[self::SESSION_KEY];
    }

    public function clearCart() {
        $_SESSION[self::SESSION_KEY] = [];
    }

    public function displayHTMLTable() {
        $cart = $this->getCart();
        $totals = $this->calculateTotal();

        echo "<html><head><style>";
        echo "body { font-family: Arial, sans-serif; margin: 20px; }";
        echo "table { border-collapse: collapse; width: 100%; max-width: 600px; }";
        echo "th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }";
        echo "th { background-color: #4CAF50; color: white; }";
        echo "tr:nth-child(even) { background-color: #f2f2f2; }";
        echo ".summary { margin-top: 20px; }";
        echo ".discount { color: green; font-weight: bold; }";
        echo ".total { color: red; font-size: 18px; font-weight: bold; }";
        echo "</style></head><body>";

        echo "<h2>Shopping Cart</h2>";
        
        if (empty($cart)) {
            echo "<p>Cart is empty</p>";
            echo "</body></html>";
            return;
        }

        echo "<table>";
        echo "<thead><tr><th>Item Name</th><th>Unit Price</th><th>Quantity</th><th>Subtotal</th></tr></thead>";
        echo "<tbody>";

        foreach ($cart as $itemName => $item) {
            $itemSubtotal = $item['price'] * $item['quantity'];
            printf(
                "<tr><td>%s</td><td>$%.2f</td><td>%d</td><td>$%.2f</td></tr>",
                htmlspecialchars($itemName),
                $item['price'],
                $item['quantity'],
                $itemSubtotal
            );
        }

        echo "</tbody></table>";

        echo "<div class='summary'>";
        printf("<p>Subtotal: $%.2f</p>", $totals['subtotal']);
        
        if ($totals['discounted']) {
            printf("<p class='discount'>Discount (10%%): -$%.2f</p>", $totals['discount']);
        }
        
        printf("<p class='total'>Total: $%.2f</p>", $totals['total']);
        echo "</div>";
        echo "</body></html>";
    }

    public function displayCLITable() {
        $cart = $this->getCart();
        $totals = $this->calculateTotal();

        if (empty($cart)) {
            echo "Cart is empty\n";
            return;
        }

        $columnWidths = [20, 12, 10, 12];
        $divider = "+" . str_repeat("-", $columnWidths[0] + 2) . "+" 
                 . str_repeat("-", $columnWidths[1] + 2) . "+" 
                 . str_repeat("-", $columnWidths[2] + 2) . "+" 
                 . str_repeat("-", $columnWidths[3] + 2) . "+\n";

        echo "\n" . $divider;
        printf("| %-{$columnWidths[0]}s | %-{$columnWidths[1]}s | %-{$columnWidths[2]}s | %-{$columnWidths[3]}s |\n",
            "Item Name", "Unit Price", "Quantity", "Subtotal");
        echo $divider;

        foreach ($cart as $itemName => $item) {
            $itemSubtotal = $item['price'] * $item['quantity'];
            printf("| %-{$columnWidths[0]}s | $%-{$columnWidths[1]}.2f | %-{$columnWidths[2]}d | $%-{$columnWidths[3]}.2f |\n",
                substr($itemName, 0, $columnWidths[0]),
                $item['price'],
                $item['quantity'],
                $itemSubtotal);
        }

        echo $divider;
        printf("| %-{$columnWidths[0]}s | %-{$columnWidths[1]}s | %-{$columnWidths[2]}s | $%-{$columnWidths[3]}.2f |\n",
            "Subtotal", "", "", $totals['subtotal']);

        if ($totals['discounted']) {
            printf("| %-{$columnWidths[0]}s | %-{$columnWidths[1]}s | %-{$columnWidths[2]}s | -$%-{$columnWidths[3]}.2f |\n",
                "Discount (10%)", "", "", $totals['discount']);
        }

        printf("| %-{$columnWidths[0]}s | %-{$columnWidths[1]}s | %-{$columnWidths[2]}s | $%-{$columnWidths[3]}.2f |\n",
            "TOTAL", "", "", $totals['total']);
        echo $divider . "\n";
    }
}

// Example usage
$cart = new ShoppingCart();

// Add items to cart
$cart->addItem("Laptop", 799.99, 1);
$cart->addItem("Mouse", 29.99, 2);
$cart->addItem("Keyboard", 89.99, 1);
$cart->addItem("Monitor", 299.99, 1);

// Display CLI output
$cart->displayCLITable();

// Uncomment below to display HTML version (output to browser)
// $cart->displayHTMLTable();

// Additional operations
// $cart->removeItem("Mouse");
// $cart->clearCart();
?>
