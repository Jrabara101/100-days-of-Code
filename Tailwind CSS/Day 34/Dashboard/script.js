// Initialize Lucide Icons
lucide.createIcons();

// ------------------------------------
// Mock Data
// ------------------------------------
const inventoryData = [
    { name: "Premium Widget 5000", sku: "WGT-5K-PRE", price: 125.99, stock: 450, status: "In Stock" },
    { name: "Standard Gasket Set", sku: "GSK-STD-10", price: 15.50, stock: 1500, status: "In Stock" },
    { name: "High-Temp Sensor Array", sku: "SNS-HT-A1", price: 299.00, stock: 25, status: "Low Stock" },
    { name: "Copper Wiring Coil (100m)", sku: "WIR-CU-100", price: 89.90, stock: 10, status: "Critical" },
    { name: "Reinforced Steel Bracket", sku: "BRK-STL-R", price: 4.95, stock: 5000, status: "In Stock" },
    { name: "Eco-Friendly Packing Material", sku: "PK-ECO-B3", price: 22.00, stock: 120, status: "In Stock" },
];

// ------------------------------------
// Chart Initialization
// ------------------------------------
function initCharts() {
    // Chart 1: Inventory Value Over Time
    const valueCtx = document.getElementById('valueChart').getContext('2d');
    new Chart(valueCtx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
            datasets: [{
                label: 'Value ($)',
                data: [1900000, 2100000, 2050000, 2200000, 2350000, 2450123, 2390000],
                borderColor: '#4f46e5',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#4f46e5'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                title: { display: false }
            },
            scales: {
                y: { beginAtZero: false, grid: { color: '#f3f4f6' } },
                x: { grid: { display: false } }
            }
        }
    });

    // Chart 2: Stock Movement (Bar Chart)
    const movementCtx = document.getElementById('movementChart').getContext('2d');
    new Chart(movementCtx, {
        type: 'bar',
        data: {
            labels: ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'],
            datasets: [
                {
                    label: 'Stock In',
                    data: [3000, 4500, 3200, 5000, 6100, 5500],
                    backgroundColor: '#059669',
                    borderRadius: 4
                },
                {
                    label: 'Stock Out',
                    data: [2200, 3800, 3000, 4100, 5500, 4900],
                    backgroundColor: '#ef4444',
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
                title: { display: false }
            },
            scales: {
                x: { stacked: true, grid: { display: false } },
                y: { stacked: false, beginAtZero: true, grid: { color: '#f3f4f6' } }
            }
        }
    });
}

// ------------------------------------
// Data Table Rendering
// ------------------------------------
function renderTable() {
    const tableBody = document.getElementById('inventory-table-body');
    tableBody.innerHTML = ''; // Clear existing rows

    inventoryData.forEach(item => {
        let statusColor = 'bg-gray-200 text-gray-800';
        if (item.status === 'In Stock') statusColor = 'bg-green-100 text-green-800';
        else if (item.status === 'Low Stock') statusColor = 'bg-amber-100 text-amber-800';
        else if (item.status === 'Critical') statusColor = 'bg-red-100 text-red-800';

        const formattedPrice = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(item.price);

        const row = document.createElement('tr');
        row.className = 'hover:bg-indigo-50/50 transition duration-100';
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${item.name}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.sku}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-semibold">${formattedPrice}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.stock}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}">
                    ${item.status}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button class="text-indigo-600 hover:text-indigo-900 mr-3 p-1 rounded hover:bg-indigo-100 transition duration-150">
                    <i data-lucide="square-pen" class="w-4 h-4"></i>
                </button>
                <button class="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-100 transition duration-150">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
        lucide.createIcons();
    });
}

// ------------------------------------
// Initialize everything on load
// ------------------------------------
window.onload = function() {
    initCharts();
    renderTable();
};
