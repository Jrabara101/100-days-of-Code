<?php

/**
 * CLI ShopScout
 * Product Search & Filter Engine
 */

define('PRODUCTS_FILE', __DIR__ . '/products.json');

// --- ANSI Colors ---
class Color {
    const RESET = "\033[0m";
    const BOLD = "\033[1m";
    const RED = "\033[31m";
    const GREEN = "\033[32m";
    const YELLOW = "\033[33m";
    const BLUE = "\033[34m";
    const CYAN = "\033[36m";
    const WHITE = "\033[37m";
    const GRAY = "\033[90m";
}

// --- State Management ---
$state = [
    'products' => [],
    'filtered' => [],
    'filters' => [
        'keyword' => '',
        'category' => '',
        'price_min' => null,
        'price_max' => null,
        'rating_min' => null,
    ],
    'sort' => 'id_asc',
    'page' => 1,
    'per_page' => 10,
    'message' => ''
];

// --- Data Loading ---
function loadProducts() {
    if (!file_exists(PRODUCTS_FILE)) {
        return [];
    }
    $json = file_get_contents(PRODUCTS_FILE);
    return json_decode($json, true) ?? [];
}

$state['products'] = loadProducts();
$state['filtered'] = $state['products'];

// --- Logic Engines ---

// --- Logic Engines ---

function searchByKeyword($products, $keyword) {
    if (empty($keyword)) return $products;

    // Technical Challenge: preg_grep()
    // We isolate product names, search them, and return matching products.
    $names = array_column($products, 'name', 'id'); // Preserve ID as key if array is indexed by ID? 
    // actually $products is list, keys are 0,1,2...
    // simpler:
    $names = array_map(function($p) { return $p['name']; }, $products);
    
    // Case insensitive partial match
    $matches = preg_grep("/" . preg_quote($keyword, '/') . "/i", $names);
    
    // Intersect keys to get full products back
    // valid keys are keys of $matches
    return array_intersect_key($products, $matches);
}

function applyFilters($products, $filters) {
    
    // 1. Keyword Search (using preg_grep logic separated)
    if (!empty($filters['keyword'])) {
        $products = searchByKeyword($products, $filters['keyword']);
    }

    // 2. Attribute Filtering (using array_filter)
    // Technical Challenge: array_filter()
    return array_filter($products, function($p) use ($filters) {
        // Category Filter
        if (!empty($filters['category'])) {
            if (strcasecmp($p['category'], $filters['category']) !== 0) {
                return false;
            }
        }

        // Price Range
        if ($filters['price_min'] !== null && $p['price'] < $filters['price_min']) return false;
        if ($filters['price_max'] !== null && $p['price'] > $filters['price_max']) return false;

        // Rating
        if ($filters['rating_min'] !== null && $p['rating'] < $filters['rating_min']) return false;

        return true;
    });
}

function sortProducts(&$products, $sortMode) {
    // Technical Challenge: usort()
    usort($products, function($a, $b) use ($sortMode) {
        switch ($sortMode) {
            case 'price_asc':
                return $a['price'] <=> $b['price'];
            case 'price_desc':
                return $b['price'] <=> $a['price'];
            case 'rating_desc':
                return $b['rating'] <=> $a['rating']; // High to Low
            default: // id_asc
                return $a['id'] <=> $b['id'];
        }
    });
}

function formatProductsForDisplay($products) {
    // Technical Challenge: array_map()
    // Pre-formatting currency or labels
    return array_map(function($p) {
        $p['price_fmt'] = number_format($p['price'], 2);
        $p['rating_fmt'] = $p['rating'] . " *";
        return $p;
    }, $products);
}

// --- UI Rendering ---

function clearScreen() {
    // Basic clearing
    if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
        system('cls');
    } else {
        system('clear');
    }
}

function renderHeader($state) {
    echo Color::CYAN . "============================================================" . Color::RESET . "\n";
    echo Color::BOLD . "   SHOPSCOUT INVENTORY " . Color::RESET . "(Total: " . count($state['products']) . " | Showing: " . count($state['filtered']) . ")\n";
    echo Color::CYAN . "============================================================" . Color::RESET . "\n";
    
    // Status Bar
    $f = $state['filters'];
    echo "Filters: ";
    echo "[ Keyword: " . ($f['keyword'] ?: 'None') . " ] ";
    echo "[ Cat: " . ($f['category'] ?: 'All') . " ] ";
    echo "[ Price: " . ($f['price_min']!==null ? $f['price_min'] : '0') . "-" . ($f['price_max']!==null ? $f['price_max'] : 'Inf') . " ] ";
    echo "[ Min Rating: " . ($f['rating_min']!==null ? $f['rating_min'] : '0') . " ]\n";
    echo "Sort:    " . $state['sort'] . "\n";
    echo "Page:    " . $state['page'] . "\n";
    if (!empty($state['message'])) {
        echo Color::YELLOW . "\n>> " . $state['message'] . Color::RESET . "\n";
    }
    echo "\n";
}

function renderTable($products, $page, $perPage) {
    // Pagination slicing
    $offset = ($page - 1) * $perPage;
    $slice = array_slice($products, $offset, $perPage);

    // Apply formatting using array_map wrapper logic just for the slice to save power?
    // Or we should have done it before. Let's do it here on the slice.
    $displaySlice = formatProductsForDisplay($slice);

    if (empty($displaySlice)) {
        echo Color::RED . "No products found matching criteria.\n" . Color::RESET;
        return;
    }

    // Column Widths (Visual)
    // ID: 5, Name: 24, Cat: 14, Price: 12, Rate: 8, Stock: 12
    
    echo "+-----+--------------------------+--------------+------------+----------+--------------+\n";
    echo "| ID  | Product Name             | Category     | Price      | Rate     | Stock        |\n";
    echo "+-----+--------------------------+--------------+------------+----------+--------------+\n";

    foreach ($displaySlice as $p) {
        $id = str_pad($p['id'], 3, '0', STR_PAD_LEFT);
        
        // Name
        $nameRaw = substr($p['name'], 0, 24);
        $nameStr = str_pad($nameRaw, 24);

        // Category
        $catRaw = substr($p['category'], 0, 14);
        $catStr = str_pad($catRaw, 14);

        // Price (Using formatted)
        // number_format default is decimals=0 in previous code? 
        // User asked "45,000". number_format($p['price']) gives 45,000 (0 decimals default? No, 0 default).
        // My formatProductsForDisplay used 2 decimals. 
        // The ascii mockup showed "45,000".
        // I will stick to "45,000" (0 decimals) for space.
        // Let's adjust formatProductsForDisplay to 0 decimals for CLI compactness or 2 strictly.
        // I'll override here for visual compactness if needed, but let's use the mapped value to prove point.
        // Let's change formatProductsForDisplay to 0 decimals.
        
        $priceStr = str_pad(number_format($p['price']), 10, ' ', STR_PAD_LEFT); 

        // Rate (Using formatted)
        $rateStr = str_pad($p['rating_fmt'], 8); 

        // Stock
        $stockVal = $p['stock'];
        $stockDisplay = "";
        
        if ($stockVal == 0) {
            $text = str_pad("OUT OF STOCK", 12);
            $stockDisplay = Color::RED . $text . Color::RESET; 
        } elseif ($stockVal < 5) {
            $text = str_pad("LOW: $stockVal", 12);
            $stockDisplay = Color::YELLOW . $text . Color::RESET;
        } else {
            $text = str_pad((string)$stockVal, 12);
            $stockDisplay = Color::GREEN . $text . Color::RESET;
        }
        
        echo "| " . str_pad($id, 3, '0', STR_PAD_LEFT) . " | " 
             . $nameStr . " | " 
             . $catStr . " | " 
             . $priceStr . " | " 
             . $rateStr . " | " 
             . $stockDisplay . " |\n";
    }
    echo "+-----+--------------------------+--------------+------------+----------+--------------+\n";
}

// --- Main Input Loop ---

while (true) {
    // 1. Process Data
    $state['filtered'] = applyFilters($state['products'], $state['filters']);
    sortProducts($state['filtered'], $state['sort']);

    // Pagination Checks
    $totalPages = ceil(count($state['filtered']) / $state['per_page']);
    if ($totalPages < 1) $totalPages = 1;
    if ($state['page'] > $totalPages) $state['page'] = $totalPages;
    if ($state['page'] < 1) $state['page'] = 1;

    // 2. Render
    clearScreen();
    renderHeader($state);
    renderTable($state['filtered'], $state['page'], $state['per_page']);

    // 3. Prompt
    echo "\n" . Color::GREEN . "Commands" . Color::RESET . ": [S]earch, [F]ilter, [O]rder, [P]age, [R]eset, [E]xit\n";
    echo "> Input: ";
    $line = trim(fgets(STDIN));
    $cmd = strtoupper(substr($line, 0, 1)); // First char command usually
    
    // Clear message
    $state['message'] = '';

    switch ($cmd) {
        case 'S': // Search Keyword
            echo "Enter Keyword: ";
            $k = trim(fgets(STDIN));
            $state['filters']['keyword'] = $k;
            $state['page'] = 1;
            break;

        case 'F': // Filter Menu
            echo "Filter by (C)ategory, (P)rice, (R)ating: ";
            $fType = strtoupper(trim(fgets(STDIN)));
            if ($fType === 'C') {
                echo "Enter Category (Electronics, Fashion, Kitchen): ";
                $state['filters']['category'] = trim(fgets(STDIN));
            } elseif ($fType === 'P') {
                echo "Min Price: "; $min = trim(fgets(STDIN));
                echo "Max Price: "; $max = trim(fgets(STDIN));
                $state['filters']['price_min'] = ($min === '') ? null : (float)$min;
                $state['filters']['price_max'] = ($max === '') ? null : (float)$max;
            } elseif ($fType === 'R') {
                echo "Min Rating (e.g. 4.0): ";
                $r = trim(fgets(STDIN));
                $state['filters']['rating_min'] = ($r === '') ? null : (float)$r;
            }
            $state['page'] = 1;
            break;

        case 'O': // Order/Sort
            echo "Sort by (P)rice Low-High, (PD) Price High-Low, (R)ating High-Low: ";
            $sType = strtoupper(trim(fgets(STDIN)));
            if ($sType === 'P') $state['sort'] = 'price_asc';
            if ($sType === 'PD') $state['sort'] = 'price_desc';
            if ($sType === 'R') $state['sort'] = 'rating_desc';
            break;

        case 'P': // Pagination
            echo "Next (N) or Prev (P)? ";
            $pType = strtoupper(trim(fgets(STDIN)));
            if ($pType === 'N') $state['page']++;
            if ($pType === 'P') $state['page']--;
            break;
            
        case 'R': // Reset
            $state['filters'] = [
                'keyword' => '',
                'category' => '',
                'price_min' => null,
                'price_max' => null,
                'rating_min' => null,
            ];
            $state['sort'] = 'id_asc';
            $state['page'] = 1;
            $state['message'] = "Filters Reset.";
            break;

        case 'E':
            exit("Goodbye!\n");
            
        default:
            $state['message'] = "Unknown Command.";
            break;
    }
}
