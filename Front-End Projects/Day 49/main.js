// IRON_LEDGER_SYSTEM Logic
document.addEventListener('DOMContentLoaded', () => {
    // --- STATE ---
    let currentMovement = 'SANDBAG_CARRY';
    let logs = JSON.parse(localStorage.getItem('iron_ledger_logs')) || {};

    // --- DOM ELEMENTS ---
    const sysTimeEl = document.getElementById('sys-time');
    const movementItems = document.querySelectorAll('.movement-item');
    const totalVolumeEl = document.getElementById('total-volume');
    const trendIndicatorEl = document.getElementById('trend-indicator');
    const pbValEl = document.getElementById('pb-val');
    const pbStatusEl = document.getElementById('pb-status');
    const prevValEl = document.getElementById('prev-val');
    const prevStatusEl = document.getElementById('prev-status');
    const chartPath = document.getElementById('chart-path');
    const diagnosticText = document.getElementById('diagnostic-text');
    const reportIdEl = document.getElementById('report-id');

    const modal = document.getElementById('modal-overlay');
    const logForm = document.getElementById('log-form');
    const openModalBtn = document.getElementById('open-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const logMovementInput = document.getElementById('log-movement');

    // --- INITIALIZATION ---
    function init() {
        updateClock();
        setInterval(updateClock, 1000);
        renderMovementSelector();
        updateUI();
    }

    // --- HELPERS ---
    function updateClock() {
        const now = new Date();
        const h = String(now.getHours()).padStart(2, '0');
        const m = String(now.getMinutes()).padStart(2, '0');
        const s = String(now.getSeconds()).padStart(2, '0');
        sysTimeEl.textContent = `[SYS_TIME: ${h}:${m}:${s}]`;
    }

    function saveLogs() {
        localStorage.setItem('iron_ledger_logs', JSON.stringify(logs));
    }

    // --- UI UPDATES ---
    function updateUI() {
        const movementLogs = logs[currentMovement] || [];
        
        // Stats calculation
        const volumes = movementLogs.map(l => l.load * l.reps);
        const totalVol = volumes.reduce((a, b) => a + b, 0);
        const pb = Math.max(0, ...movementLogs.map(l => l.load));
        const prevEntry = movementLogs.length > 0 ? movementLogs[movementLogs.length - 1] : null;

        // Animated Numbers
        animateValue(totalVolumeEl, parseInt(totalVolumeEl.innerText) || 0, totalVol, 500);
        pbValEl.textContent = pb;
        prevValEl.textContent = prevEntry ? prevEntry.load : 0;

        // Trend
        if (movementLogs.length >= 2) {
            const last = volumes[volumes.length - 1];
            const secondLast = volumes[volumes.length - 2];
            const diff = ((last - secondLast) / secondLast) * 100;
            trendIndicatorEl.textContent = `Δ ${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`;
            trendIndicatorEl.style.color = diff >= 0 ? 'var(--terminal-cyan)' : '#ff4b4b';
        } else {
            trendIndicatorEl.textContent = 'Δ --%';
        }

        // Status
        pbStatusEl.textContent = pb > 0 ? 'OPTIMAL' : 'INITIALIZING';
        prevStatusEl.textContent = prevEntry ? 'NOMINAL' : 'WAITING';

        renderChart(volumes);
        updateDiagnostic(movementLogs, totalVol);
    }

    function animateValue(obj, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start).toLocaleString();
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    function renderChart(volumes) {
        if (volumes.length < 2) {
            chartPath.setAttribute('points', '0,150 400,150');
            return;
        }

        const maxVol = Math.max(...volumes, 100);
        const minVol = Math.min(...volumes);
        const range = maxVol - minVol || 1;
        
        const count = volumes.length;
        const stepX = 400 / (count - 1);
        
        const points = volumes.map((v, i) => {
            const x = i * stepX;
            const y = 140 - ((v - minVol) / range) * 130; // 10px padding
            return `${x},${y}`;
        }).join(' ');

        chartPath.setAttribute('points', points);
    }

    function updateDiagnostic(movementLogs, totalVol) {
        reportIdEl.textContent = Math.floor(Math.random() * 900) + 100;
        
        if (movementLogs.length === 0) {
            diagnosticText.innerHTML = 'WAITING FOR DATA INPUT... <br><br>ESTABLISH BASELINE VOLUME TO GENERATE RECOMMENDATIONS.';
            return;
        }

        if (movementLogs.length < 3) {
            diagnosticText.innerHTML = 'COLLECTING DATA SAMPLES... <br><br>NEED MORE LOG ENTRIES FOR STATISTICAL SIGNIFICANCE.';
            return;
        }

        const lastThree = movementLogs.slice(-3);
        const avg = lastThree.reduce((a, b) => a + (b.load * b.reps), 0) / 3;
        
        diagnosticText.innerHTML = `DATA_ANALYSIS: VOLUME_CORRELATION[${currentMovement}] SHOWS ${avg > 1000 ? 'POSITIVE' : 'STABLE'} TREND. <br><br> RECOMMENDATION: INCREMENT_LOAD_COEFFICIENT BY +2.5KG. PREPARE FOR PEAK LOAD PHASE.`;
    }

    function renderMovementSelector() {
        movementItems.forEach(item => {
            item.addEventListener('click', () => {
                movementItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                currentMovement = item.dataset.type;
                updateUI();
            });
        });
    }

    // --- MODAL & FORM ---
    openModalBtn.onclick = () => {
        logMovementInput.value = currentMovement;
        modal.classList.add('active');
    };

    closeModalBtn.onclick = () => {
        modal.classList.remove('active');
    };

    logForm.onsubmit = (e) => {
        e.preventDefault();
        const weight = parseFloat(document.getElementById('log-weight').value);
        const reps = parseInt(document.getElementById('log-reps').value);

        if (!logs[currentMovement]) logs[currentMovement] = [];
        logs[currentMovement].push({
            load: weight,
            reps: reps,
            timestamp: new Date().toISOString()
        });

        saveLogs();
        updateUI();
        modal.classList.remove('active');
        logForm.reset();
    };

    init();
});
