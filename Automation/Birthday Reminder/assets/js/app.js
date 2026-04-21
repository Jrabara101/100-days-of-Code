/* ============================================================
   Birthday Reminder — Dashboard JavaScript
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

    // ─── Sidebar Toggle ──────────────────────────────────────
    const sidebar        = document.getElementById('sidebar');
    const menuToggle     = document.getElementById('menuToggle');
    const sidebarClose   = document.getElementById('sidebarClose');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    function openSidebar() {
        sidebar?.classList.add('open');
        sidebarOverlay?.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeSidebar() {
        sidebar?.classList.remove('open');
        sidebarOverlay?.classList.remove('open');
        document.body.style.overflow = '';
    }

    menuToggle?.addEventListener('click', openSidebar);
    sidebarClose?.addEventListener('click', closeSidebar);
    sidebarOverlay?.addEventListener('click', closeSidebar);

    // ─── Dark Mode Toggle ────────────────────────────────────
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon   = themeToggle?.querySelector('.theme-icon');
    const html        = document.documentElement;

    // Restore saved preference
    const savedTheme = localStorage.getItem('br_theme') || 'light';
    html.setAttribute('data-theme', savedTheme);
    if (themeIcon) themeIcon.textContent = savedTheme === 'dark' ? '☀️' : '🌙';

    themeToggle?.addEventListener('click', () => {
        const current = html.getAttribute('data-theme');
        const next    = current === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', next);
        localStorage.setItem('br_theme', next);
        if (themeIcon) themeIcon.textContent = next === 'dark' ? '☀️' : '🌙';
    });

    // ─── Stat Counter Animation ──────────────────────────────
    const statValues = document.querySelectorAll('.stat-value[data-count]');

    statValues.forEach(el => {
        const target   = parseInt(el.dataset.count, 10);
        const duration = 900;
        const stepTime = 16;
        const steps    = Math.ceil(duration / stepTime);
        let   current  = 0;

        if (target === 0) { el.textContent = '0'; return; }

        const increment = target / steps;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                el.textContent = target.toLocaleString();
                clearInterval(timer);
            } else {
                el.textContent = Math.floor(current).toLocaleString();
            }
        }, stepTime);
    });

    // ─── Auto-dismiss Flash Messages ────────────────────────
    const flashAlert = document.getElementById('flashAlert');
    if (flashAlert) {
        setTimeout(() => {
            flashAlert.style.transition = 'opacity .4s ease';
            flashAlert.style.opacity = '0';
            setTimeout(() => flashAlert.remove(), 400);
        }, 4500);
    }

    // ─── Delete Confirmation Modal ───────────────────────────
    const deleteModal    = document.getElementById('deleteModal');
    const deleteForm     = document.getElementById('deleteForm');
    const deleteTargetId = document.getElementById('deleteTargetId');
    const deleteTargetName = document.getElementById('deleteTargetName');

    window.confirmDelete = function (id, name, actionUrl) {
        if (deleteTargetId)   deleteTargetId.value = id;
        if (deleteTargetName) deleteTargetName.textContent = name;
        if (deleteForm)       deleteForm.action = actionUrl;
        deleteModal?.classList.add('open');
    };

    window.closeDeleteModal = function () {
        deleteModal?.classList.remove('open');
    };

    // Close modal on overlay click
    deleteModal?.addEventListener('click', (e) => {
        if (e.target === deleteModal) closeDeleteModal();
    });

    // Close on ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeDeleteModal();
    });

    // ─── Dynamic Reminder Rule Rows (Create/Edit forms) ─────
    const rulesContainer = document.getElementById('rulesContainer');
    const addRuleBtn     = document.getElementById('addRuleBtn');

    function buildRuleRow(index, daysBefore = '0', deliveryType = 'dashboard') {
        const row = document.createElement('div');
        row.className = 'rule-row';
        row.innerHTML = `
            <div class="form-group">
                <label class="form-label">Remind</label>
                <select name="days_before[]" class="form-control">
                    <option value="0"  ${daysBefore === '0' ? 'selected' : ''}>Same Day</option>
                    <option value="1"  ${daysBefore === '1' ? 'selected' : ''}>1 Day Before</option>
                    <option value="3"  ${daysBefore === '3' ? 'selected' : ''}>3 Days Before</option>
                    <option value="7"  ${daysBefore === '7' ? 'selected' : ''}>7 Days Before</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Delivery</label>
                <select name="delivery_type[]" class="form-control">
                    <option value="dashboard" ${deliveryType === 'dashboard' ? 'selected' : ''}>🔔 Dashboard</option>
                    <option value="email"     ${deliveryType === 'email'     ? 'selected' : ''}>✉ Email</option>
                    <option value="sms"       ${deliveryType === 'sms'       ? 'selected' : ''}>💬 SMS</option>
                </select>
            </div>
            <button type="button" class="rule-remove" title="Remove rule" onclick="removeRuleRow(this)">✕</button>
        `;
        return row;
    }

    addRuleBtn?.addEventListener('click', () => {
        if (!rulesContainer) return;
        const index = rulesContainer.querySelectorAll('.rule-row').length;
        rulesContainer.appendChild(buildRuleRow(index));
    });

    window.removeRuleRow = function(btn) {
        const row = btn.closest('.rule-row');
        if (rulesContainer && rulesContainer.querySelectorAll('.rule-row').length <= 1) {
            // Keep at least one rule row
            return;
        }
        row?.remove();
    };

    // ─── Monthly Birthday Chart (Chart.js) ──────────────────
    const chartCanvas = document.getElementById('monthlyChart');
    if (chartCanvas && window.MONTHLY_DATA) {
        const labels = [
            'Jan','Feb','Mar','Apr','May','Jun',
            'Jul','Aug','Sep','Oct','Nov','Dec'
        ];
        const counts = new Array(12).fill(0);

        window.MONTHLY_DATA.forEach(row => {
            counts[parseInt(row.month, 10) - 1] = parseInt(row.count, 10);
        });

        // Detect theme for chart colours
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const gridColor = isDark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.05)';
        const textColor = isDark ? '#94a3b8' : '#64748b';

        /* global Chart */
        if (typeof Chart !== 'undefined') {
            new Chart(chartCanvas, {
                type: 'bar',
                data: {
                    labels,
                    datasets: [{
                        label: 'Birthdays',
                        data: counts,
                        backgroundColor: 'rgba(99,102,241,.7)',
                        borderColor: 'rgba(99,102,241,1)',
                        borderWidth: 1.5,
                        borderRadius: 6,
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: ctx => ` ${ctx.parsed.y} birthday${ctx.parsed.y !== 1 ? 's' : ''}`
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { stepSize: 1, color: textColor },
                            grid: { color: gridColor }
                        },
                        x: {
                            ticks: { color: textColor },
                            grid: { display: false }
                        }
                    }
                }
            });
        }
    }

    // ─── Table Search (client-side, instant) ─────────────────
    const tableSearch = document.getElementById('tableSearch');
    if (tableSearch) {
        tableSearch.addEventListener('input', function () {
            const term = this.value.toLowerCase();
            document.querySelectorAll('.searchable-row').forEach(row => {
                row.style.display = row.textContent.toLowerCase().includes(term) ? '' : 'none';
            });
        });
    }

});
