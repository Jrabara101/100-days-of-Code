// --- WEB AUDIO SYNTHESIZER ---
class SoundController {
    constructor() {
        this.audioCtx = null;
        this.isMuted = false;

        // Music loop states
        this.musicSchedulerId = null;
        this.nextNoteTime = 0.0;
        this.currentStep = 0; // eighth notes (0 to 63)
        this.isPlayingMusic = false;
        this.musicGainNode = null;
    }

    init() {
        if (this.audioCtx) return;
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        const toggle = document.getElementById('sound-toggle');
        if (this.isMuted) {
            toggle.classList.add('muted');
            toggle.innerHTML = `<svg viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.21.05-.42.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>`;
            this.stopBackgroundMusic();
        } else {
            toggle.classList.remove('muted');
            toggle.innerHTML = `<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`;
            this.startBackgroundMusic();
        }
    }

    startBackgroundMusic() {
        this.init();
        if (!this.audioCtx || this.isMuted || this.isPlayingMusic) return;

        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        if (!this.musicGainNode) {
            this.musicGainNode = this.audioCtx.createGain();
            this.musicGainNode.gain.setValueAtTime(0.05, this.audioCtx.currentTime); // Louder background music
            this.musicGainNode.connect(this.audioCtx.destination);
        }

        this.isPlayingMusic = true;
        this.nextNoteTime = this.audioCtx.currentTime + 0.1;
        this.currentStep = 0;

        this.musicSchedulerId = setInterval(() => {
            this.scheduler();
        }, 50);
    }

    stopBackgroundMusic() {
        if (!this.isPlayingMusic) return;
        this.isPlayingMusic = false;
        if (this.musicSchedulerId) {
            clearInterval(this.musicSchedulerId);
            this.musicSchedulerId = null;
        }
    }

    scheduler() {
        while (this.nextNoteTime < this.audioCtx.currentTime + 0.2) {
            this.scheduleNextNote(this.currentStep, this.nextNoteTime);
            // BPM = 90. Eighth note step = 30 / 90 = 0.3333s
            this.nextNoteTime += 0.3333;
            this.currentStep = (this.currentStep + 1) % 64;
        }
    }

    scheduleNextNote(step, time) {
        const chordIndex = Math.floor(step / 16);
        const localStep = step % 16;

        // Bossa Nova chord rhythm hits on local step: 0, 3, 6, 8, 11, 14
        const chordHits = [0, 3, 6, 8, 11, 14];
        const isChordHit = chordHits.includes(localStep);

        // Bass rhythm hits on even steps: 0, 2, 4, 6, 8, 10, 12, 14
        const isBassHit = (localStep % 2 === 0);

        const progressions = [
            // Cmaj7: C4, E4, G4, B4
            {
                bassRoot: 65.41, // C2
                bassFifth: 98.00, // G2
                chordFreqs: [261.63, 329.63, 392.00, 493.88]
            },
            // Am7: A3, C4, E4, G4
            {
                bassRoot: 55.00, // A1
                bassFifth: 82.41, // E2
                chordFreqs: [220.00, 261.63, 329.63, 392.00]
            },
            // Dm7: D4, F4, A4, C5
            {
                bassRoot: 73.42, // D2
                bassFifth: 110.00, // A2
                chordFreqs: [293.66, 349.23, 440.00, 523.25]
            },
            // G7: G3, B3, D4, F4
            {
                bassRoot: 49.00, // G1
                bassFifth: 73.42, // D2
                chordFreqs: [196.00, 246.94, 293.66, 349.23]
            }
        ];

        const currentProg = progressions[chordIndex];

        if (isChordHit) {
            currentProg.chordFreqs.forEach((freq, idx) => {
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, time);
                
                const duration = 0.8;
                gain.gain.setValueAtTime(0, time);
                gain.gain.linearRampToValueAtTime(0.04, time + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
                
                osc.connect(gain);
                gain.connect(this.musicGainNode);
                
                osc.start(time);
                osc.stop(time + duration);
            });
        }

        if (isBassHit) {
            const isRoot = (localStep % 4 === 0);
            const freq = isRoot ? currentProg.bassRoot : currentProg.bassFifth;
            
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, time);
            
            const duration = 0.5;
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.12, time + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
            
            osc.connect(gain);
            gain.connect(this.musicGainNode);
            
            osc.start(time);
            osc.stop(time + duration);
        }
    }

    play(type) {
        this.init();
        if (!this.audioCtx || this.isMuted) return;

        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        const now = this.audioCtx.currentTime;

        if (type === 'select') {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.08);
            
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
            
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.08);
        } 
        else if (type === 'drop') {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(180, now);
            osc.frequency.exponentialRampToValueAtTime(60, now + 0.12);
            
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
            
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.12);
        }
        else if (type === 'reset') {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(250, now);
            osc.frequency.exponentialRampToValueAtTime(120, now + 0.25);
            
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
            
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.25);
        }
        else if (type === 'error') {
            const osc1 = this.audioCtx.createOscillator();
            const osc2 = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            
            osc1.type = 'sawtooth';
            osc1.frequency.setValueAtTime(95, now);
            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(97, now);
            
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
            
            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(this.audioCtx.destination);
            
            osc1.start(now);
            osc2.start(now);
            osc1.stop(now + 0.25);
            osc2.stop(now + 0.25);
        }
        else if (type === 'win') {
            const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
            notes.forEach((freq, idx) => {
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();
                osc.type = 'sine';
                
                const time = now + idx * 0.08;
                osc.frequency.setValueAtTime(freq, time);
                
                gain.gain.setValueAtTime(0.15, time);
                gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
                
                osc.connect(gain);
                gain.connect(this.audioCtx.destination);
                
                osc.start(time);
                osc.stop(time + 0.4);
            });
        }
    }
}

// --- CANVAS ATOMIC PARTICLES SYSTEM ---
class ParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.active = false;
        this.colors = ['#40E0D0', '#00CED1', '#E1AD01', '#DAA520', '#ffffff', '#F5F5F0'];

        window.addEventListener('resize', () => this.resize());
        this.resize();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    burst(x, y) {
        this.active = true;
        this.particles = [];
        const count = 120;
        
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const velocity = 3 + Math.random() * 8;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity - 2,
                size: 6 + Math.random() * 12,
                color: this.colors[Math.floor(Math.random() * this.colors.length)],
                alpha: 1,
                decay: 0.015 + Math.random() * 0.015,
                rotation: Math.random() * Math.PI,
                rotationSpeed: (Math.random() - 0.5) * 0.1,
                type: Math.random() > 0.4 ? 'atom' : 'dot'
            });
        }
        this.animate();
    }

    stop() {
        this.active = false;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    animate() {
        if (!this.active) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        let alive = false;

        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.15;
            p.alpha -= p.decay;
            p.rotation += p.rotationSpeed;

            if (p.alpha > 0) {
                alive = true;
                this.ctx.save();
                this.ctx.translate(p.x, p.y);
                this.ctx.rotate(p.rotation);
                this.ctx.globalAlpha = p.alpha;

                if (p.type === 'atom') {
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, p.size / 4, 0, Math.PI * 2);
                    this.ctx.fillStyle = p.color;
                    this.ctx.fill();

                    this.ctx.strokeStyle = p.color;
                    this.ctx.lineWidth = 1.5;
                    
                    this.ctx.beginPath();
                    this.ctx.ellipse(0, 0, p.size, p.size / 3, Math.PI / 4, 0, Math.PI * 2);
                    this.ctx.stroke();

                    this.ctx.beginPath();
                    this.ctx.ellipse(0, 0, p.size, p.size / 3, -Math.PI / 4, 0, Math.PI * 2);
                    this.ctx.stroke();
                } else {
                    this.ctx.beginPath();
                    for (let j = 0; j < 4; j++) {
                        this.ctx.rotate(Math.PI / 4);
                        this.ctx.rect(-p.size / 2, -1, p.size, 2);
                        this.ctx.rect(-1, -p.size / 2, 2, p.size);
                    }
                    this.ctx.fillStyle = p.color;
                    this.ctx.fill();
                }
                this.ctx.restore();
            }
        });

        if (alive) {
            requestAnimationFrame(() => this.animate());
        }
    }
}

// --- TEAK WORD SCRAMBLE ENGINE ---
class TeakScrambleGame {
    constructor() {
        this.currentCategory = 'general';
        this.dictionary = {
            general: {
                1: ["LINE", "WOOD", "TRAY", "GLOW", "TILE", "GAME", "PLAY", "ATOM"],
                2: ["BOARD", "GRAIN", "SLOTS", "CHECK", "RESET", "VALVE", "RADIO"],
                3: ["ENGINE", "MATRIX", "VECTOR", "CANVAS", "BUFFER", "KERNEL", "ROUTER"],
                4: ["CABINET", "PARQUET", "SCRAMBLE", "DISPLAY", "SHADOWS", "INLAYS"],
                5: ["AUTOMATA", "SKEUOMOR", "MIDCENTU", "MAHOGANY", "FLUIDITY"]
            },
            science: {
                1: ["ATOM", "CELL", "GENE", "BOND", "ACID", "IONS", "WAVE", "LENS"],
                2: ["FORCE", "ORGAN", "LIGHT", "SPACE", "VIRUS", "FOSSIL", "RADAR"],
                3: ["NEURON", "PROTON", "OXYGEN", "PLASMA", "GRAVITY", "MUTATION"],
                4: ["GENETICS", "MOLECULE", "ELEMENTS", "ELECTRON", "VELOCITY", "CATALYST"],
                5: ["EVOLUTION", "CHEMISTRY", "ASTRONOMY", "TELESCOPE", "ORGANISMS"]
            },
            math: {
                1: ["LINE", "CONE", "AREA", "MATH", "SINE", "ZERO", "ROOT", "PLOTS"],
                2: ["ANGLE", "GRAPH", "RATIO", "PRIME", "LOGIC", "PROOF", "CURVE"],
                3: ["ALGEBRA", "DECIMAL", "GRIDDED", "VECTORS", "RADIUS", "INTEGER"],
                4: ["GEOMETRY", "CALCULUS", "FRACTION", "EQUATION", "DECIMALS", "THEOREM"],
                5: ["STATISTICS", "EXPONENT", "POLYGONAL", "FRACTALISM", "ALGORITHMS"]
            },
            history: {
                1: ["WARS", "KING", "ROME", "TSAR", "FORT", "CLAN", "FEUD", "HEIR"],
                2: ["RUINS", "REIGN", "EMPIRE", "COLONY", "TREATY", "CASTE", "SIEGES"],
                3: ["DYNASTY", "CRUSADE", "WARRIOR", "TEMPLAR", "KNIGHTS", "REVOLTS"],
                4: ["MONARCHS", "COLONIAL", "CONQUEST", "PAPYRIAN", "VIKINGS", "HISTORY"],
                5: ["REVOLUTION", "ARCHAEOLOG", "CIVILIZATIO", "PREHISTORIC", "FEUDALISMS"]
            },
            anime: {
                1: ["GOKU", "LIMA", "NAMI", "LUFFY", "ZORO", "MONA", "ALUC", "PONY"],
                2: ["BLEACH", "NARUTO", "CONAN", "KAGURA", "TAIGA", "BORUTO", "ASUNA"],
                3: ["GINTAMA", "DORORO", "SAILOR", "MONSTER", "INUYASHA", "DEATHNOTE"],
                4: ["CLAYMORE", "EVANGELI", "SHINGEKI", "ALCHEMIS", "PROMISED", "OVERLORD"],
                5: ["FULLMETAL", "VILANDSA", "STEINSGAT", "PSYCHOPAS", "ONEPIECE"]
            },
            technology: {
                1: ["CODE", "BYTE", "DATA", "CHIP", "DISK", "RAMS", "PORT", "TECH"],
                2: ["ROUTER", "MODEM", "PROXY", "PIXEL", "CLOUD", "ARRAY", "LOGIC"],
                3: ["DATABASE", "SOFTWARE", "HARDWARE", "NETWORK", "COMPILER", "INTERNET"],
                4: ["SECURITY", "PROTOCOL", "FIREWALL", "MONITORS", "KEYBOARD", "SYSTEMS"],
                5: ["ALGORITHM", "PROGRAMMIN", "PROCESSORS", "ENCRYPTIONS", "TELEPHONIC"]
            },
            novel: {
                1: ["PLAY", "POEM", "TALE", "PAGE", "BOOK", "PLOT", "EPIC", "CAST"],
                2: ["NOVEL", "DRAMA", "PROSE", "GENRE", "WRITE", "STORY", "FOLIO"],
                3: ["DRACULA", "ODYSSEY", "HAMLET", "MACBETH", "GATSBY", "BELOVED"],
                4: ["VOLTAIRE", "LITERARY", "CHAPTERS", "FICTIONAL", "TRAGEDIE", "ROMANCES"],
                5: ["LITERATURE", "BIBLIOGRAP", "PLAYWRIGHT", "PUBLISHERS", "BIOGRAPHIE"]
            },
            "filipino-movies": {
                1: ["METR", "GOYO", "OLIV", "BATA", "BALE", "AMIG", "KIMY", "MILO"],
                2: ["HIMALA", "DEKADA", "METRO", "TANGIN", "KUBLIS", "BAGONG", "BUYBUST"],
                3: ["HENERAL", "METROMAN", "ORAPRON", "HAPILAND", "SIGWAAN", "KAPAGAN"],
                4: ["SEKLUZYO", "LUNASING", "MINSANAN", "SISTERAK", "ENTENGAN", "KAPATIDA"],
                5: ["DEKADASETEN", "HIMALAANIS", "HENERALLUN", "TANGINGYAM", "GOYOHANGIN"]
            }
        };
        
        this.boardGrid = document.getElementById('board-grid');
        this.rackSlotsContainer = document.getElementById('rack-slots');
        this.scoreElement = document.getElementById('score-val');
        this.levelElement = document.getElementById('level-val');
        this.victoryScreen = document.getElementById('victory-screen');
        this.mainBoard = document.getElementById('main-board');
        
        this.score = 0;
        this.level = 1;
        this.winStreak = 0;
        this.tilesData = []; // Initialize to prevent TypeError before levels load
        this.prefetchedData = null; // Prefetched next level word data
        this.clueLevel = 1;
        this.clue3Exhausted = false;
        this.showingPureDefinition = false;
        
        this.sound = new SoundController();
        this.particles = new ParticleSystem(document.getElementById('effects-canvas'));
        this.streakElement = document.getElementById('streak-val');

        // Custom board theme initialization
        this.currentTheme = localStorage.getItem('word_scramble_theme') || 'teak';
        this.applyTheme(this.currentTheme, false);

        // Custom chip material initialization
        this.currentChipMaterial = localStorage.getItem('word_scramble_chip_material') || 'bone';
        this.applyChipMaterial(this.currentChipMaterial, false);

        // Initialize drag-and-drop trackers
        this.activeDragTile = null;
        this.dragOffset = { x: 0, y: 0 };
        this.dragStartRect = null;
        this.hoveredCell = null;
        
        this.buildCheckerboard();
        this.registerGlobalEvents();
        
        this.isEntranceLoad = true;

        // Start background music loop on first interaction (respecting autoplay policy)
        const startMusicOnce = () => {
            if (this.sound) {
                this.sound.startBackgroundMusic();
            }
            window.removeEventListener('click', startMusicOnce);
            window.removeEventListener('keydown', startMusicOnce);
            window.removeEventListener('touchstart', startMusicOnce);
        };
        window.addEventListener('click', startMusicOnce);
        window.addEventListener('keydown', startMusicOnce);
        window.addEventListener('touchstart', startMusicOnce);
        // Trigger initial loader
        this.runLoadingScreen(this.initLevel());
    }

    buildCheckerboard() {
        this.boardGrid.innerHTML = '';
        for (let r = 0; r < 10; r++) {
            for (let c = 0; c < 10; c++) {
                const cell = document.createElement('div');
                const isLight = (r + c) % 2 === 0;
                cell.className = `grid-cell`;
                cell.style.backgroundColor = isLight ? 'var(--teak-light)' : 'var(--teak-base)';
                cell.dataset.index = r * 10 + c;
                this.boardGrid.appendChild(cell);
            }
        }
    }

    async initLevel() {
        const wordLength = Math.min(3 + this.level, 8);
        this.levelElement.innerText = this.level + " ...";
        
        let word = "";
        let clue = "";
        const cat = this.currentCategory;

        // Check if we have pre-fetched data for the current level and category
        if (this.prefetchedData && this.prefetchedData.level === this.level && this.prefetchedData.category === cat) {
            word = this.prefetchedData.word;
            clue = this.prefetchedData.clue;
            this.prefetchedData = null;
            console.log("Using pre-fetched level data:", word);
        } else {
            const isOffline = (typeof navigator !== 'undefined' && !navigator.onLine);
            // To make initial load (LCP) extremely fast, we use the offline fallback on the first entrance load or when offline
            if (this.isEntranceLoad || isOffline) {
                console.log("First load or offline: using offline fallback for instant start");
            } else {
                if (cat === 'general') {
                    try {
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 1000);
                        const response = await fetch(`https://random-word-api.herokuapp.com/word?length=${wordLength}`, {
                            signal: controller.signal
                        });
                        clearTimeout(timeoutId);
                        if (response.ok) {
                            const data = await response.json();
                            if (data && data[0]) {
                                word = data[0].toUpperCase();
                            }
                        }
                    } catch (err) {
                        console.log("General API word fetch failed (using offline fallback)");
                    }
                }
                else if (cat === 'science' || cat === 'math' || cat === 'history' || cat === 'technology' || cat === 'novel') {
                    const mlQueries = {
                        science: 'science',
                        math: 'mathematics',
                        history: 'history',
                        technology: 'technology',
                        novel: 'novel'
                    };
                    const query = mlQueries[cat];
                    try {
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 1000);
                        const response = await fetch(`https://api.datamuse.com/words?ml=${query}&md=d&max=150`, {
                            signal: controller.signal
                        });
                        clearTimeout(timeoutId);
                        if (response.ok) {
                            const data = await response.json();
                            const candidates = data.filter(item => {
                                const w = item.word.toUpperCase();
                                return w.length === wordLength && /^[A-Z]+$/.test(w);
                            });
                            if (candidates.length > 0) {
                                const chosen = candidates[Math.floor(Math.random() * candidates.length)];
                                word = chosen.word.toUpperCase();
                                if (chosen.defs && chosen.defs.length > 0) {
                                    const rawDef = chosen.defs[0];
                                    const tabIdx = rawDef.indexOf('\t');
                                    clue = tabIdx !== -1 ? rawDef.substring(tabIdx + 1) : rawDef;
                                }
                            }
                        }
                    } catch (err) {
                        console.log(`Datamuse API fetch failed for ${cat} (using offline fallback)`);
                    }
                }
                else if (cat === 'anime' || cat === 'filipino-movies') {
                    const categories = {
                        anime: 'Category:Anime_series',
                        'filipino-movies': 'Category:Philippine_films'
                    };
                    const cmtitle = categories[cat];
                    try {
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 1200);
                        const response = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=categorymembers&cmtitle=${cmtitle}&cmlimit=250&format=json&origin=*`, {
                            signal: controller.signal
                        });
                        clearTimeout(timeoutId);
                        if (response.ok) {
                            const data = await response.json();
                            if (data && data.query && data.query.categorymembers) {
                                const members = data.query.categorymembers;
                                const candidates = [];
                                members.forEach(m => {
                                    const rawTitle = m.title;
                                    if (rawTitle.toLowerCase().startsWith('list of') || rawTitle.toLowerCase().startsWith('category:')) return;
                                    let cleanTitle = rawTitle.replace(/\s*\(.*?\)\s*/g, '');
                                    cleanTitle = cleanTitle.replace(/[^a-zA-Z]/g, '').toUpperCase();
                                    if (cleanTitle.length >= 4 && cleanTitle.length <= 8) {
                                        candidates.push({ originalTitle: rawTitle, cleanTitle: cleanTitle });
                                    }
                                });
                                let filtered = candidates.filter(c => c.cleanTitle.length === wordLength);
                                if (filtered.length === 0) filtered = candidates;
                                if (filtered.length > 0) {
                                    const chosen = filtered[Math.floor(Math.random() * filtered.length)];
                                    word = chosen.cleanTitle;
                                    // Fetch Wikipedia summary asynchronously in background
                                    this.fetchWikipediaSummary(chosen.originalTitle, word).then(resolvedClue => {
                                        if (resolvedClue) {
                                            this.wordClue = this.censorWordInClue(resolvedClue, this.targetWord);
                                            this.updateClueUI();
                                        }
                                    });
                                }
                            }
                        }
                    } catch (err) {
                        console.log(`Wikipedia Category fetch failed for ${cat} (using offline fallback)`);
                    }
                }
            }
        }

        // Offline Fallback
        if (!word || !/^[A-Z]+$/.test(word) || word.length < 4 || word.length > 8) {
            console.log("Using offline fallback dictionary...");
            const levelKey = Math.min(this.level, 5);
            const wordPool = (this.dictionary[cat] && this.dictionary[cat][levelKey]) 
                ? this.dictionary[cat][levelKey] 
                : this.dictionary.general[levelKey];
            word = wordPool[Math.floor(Math.random() * wordPool.length)].toUpperCase();
        }
        
        this.targetWord = word;
        
        // Fetch definition asynchronously in background if not available and online
        if (!clue) {
            const isOffline = (typeof navigator !== 'undefined' && !navigator.onLine);
            if (!isOffline) {
                this.fetchDictionaryDefinition(word).then(resolvedClue => {
                    if (resolvedClue) {
                        this.wordClue = this.censorWordInClue(resolvedClue, this.targetWord);
                        this.updateClueUI();
                    }
                });
            }
            clue = `A word starting with '${this.targetWord[0]}' and ending with '${this.targetWord[this.targetWord.length-1]}'.`;
        }
        this.wordClue = this.censorWordInClue(clue, this.targetWord);
        
        let scrambled = this.targetWord;
        let attempts = 0;
        while (scrambled === this.targetWord && attempts < 100) {
            scrambled = this.targetWord.split('').sort(() => Math.random() - 0.5).join('');
            attempts++;
        }
        this.scrambledWord = scrambled;

        this.tilesData = [];
        this.boardOccupants = Array(100).fill(null);
        this.rackSlots = Array(this.targetWord.length).fill(null);

        const isVertical = Math.random() > 0.5;
        const len = this.targetWord.length;
        
        let startRow, startCol;
        if (isVertical) {
            startRow = Math.floor(Math.random() * (10 - len));
            startCol = Math.floor(Math.random() * 10);
        } else {
            startRow = Math.floor(Math.random() * 10);
            startCol = Math.floor(Math.random() * (10 - len));
        }

        this.targetCellIndices = [];
        for (let j = 0; j < len; j++) {
            const r = isVertical ? startRow + j : startRow;
            const c = isVertical ? startCol : startCol + j;
            this.targetCellIndices.push(r * 10 + c);
        }

        this.levelElement.innerText = this.level;
        this.buildLevelArchetype();

        this.clueLevel = 1;
        this.clue3Exhausted = false;
        this.showingPureDefinition = false;
        this.updateClueUI();

        // Start pre-fetching the word for the next level asynchronously in the background
        setTimeout(() => this.prefetchNextWord(), 1500);
    }

    async prefetchNextWord() {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            return; // completely silent and skip when offline
        }
        const nextLevel = this.level + 1;
        const wordLength = Math.min(3 + nextLevel, 8);
        const cat = this.currentCategory;
        
        let word = "";
        let clue = "";
        
        console.log(`Pre-fetching next word for Level ${nextLevel} in Category ${cat}...`);
        
        if (cat === 'general') {
            try {
                const response = await fetch(`https://random-word-api.herokuapp.com/word?length=${wordLength}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data && data[0]) {
                        word = data[0].toUpperCase();
                    }
                }
            } catch (err) {
                console.log("Pre-fetch word failed (using offline fallback)");
            }
            if (word) {
                clue = await this.fetchDictionaryDefinition(word);
            }
        }
        else if (cat === 'science' || cat === 'math' || cat === 'history' || cat === 'technology' || cat === 'novel') {
            const mlQueries = {
                science: 'science',
                math: 'mathematics',
                history: 'history',
                technology: 'technology',
                novel: 'novel'
            };
            const query = mlQueries[cat];
            try {
                const response = await fetch(`https://api.datamuse.com/words?ml=${query}&md=d&max=150`);
                if (response.ok) {
                    const data = await response.json();
                    const candidates = data.filter(item => {
                        const w = item.word.toUpperCase();
                        return w.length === wordLength && /^[A-Z]+$/.test(w);
                    });
                    if (candidates.length > 0) {
                        const chosen = candidates[Math.floor(Math.random() * candidates.length)];
                        word = chosen.word.toUpperCase();
                        if (chosen.defs && chosen.defs.length > 0) {
                            const rawDef = chosen.defs[0];
                            const tabIdx = rawDef.indexOf('\t');
                            clue = tabIdx !== -1 ? rawDef.substring(tabIdx + 1) : rawDef;
                        }
                    }
                }
            } catch (err) {
                console.log("Pre-fetch word failed (using offline fallback)");
            }
            if (word && !clue) {
                clue = await this.fetchDictionaryDefinition(word);
            }
        }
        else if (cat === 'anime' || cat === 'filipino-movies') {
            const categories = {
                anime: 'Category:Anime_series',
                'filipino-movies': 'Category:Philippine_films'
            };
            const cmtitle = categories[cat];
            try {
                const response = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=categorymembers&cmtitle=${cmtitle}&cmlimit=250&format=json&origin=*`);
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.query && data.query.categorymembers) {
                        const members = data.query.categorymembers;
                        const candidates = [];
                        members.forEach(m => {
                            const rawTitle = m.title;
                            if (rawTitle.toLowerCase().startsWith('list of') || rawTitle.toLowerCase().startsWith('category:')) return;
                            let cleanTitle = rawTitle.replace(/\s*\(.*?\)\s*/g, '');
                            cleanTitle = cleanTitle.replace(/[^a-zA-Z]/g, '').toUpperCase();
                            if (cleanTitle.length >= 4 && cleanTitle.length <= 8) {
                                candidates.push({ originalTitle: rawTitle, cleanTitle: cleanTitle });
                            }
                        });
                        let filtered = candidates.filter(c => c.cleanTitle.length === wordLength);
                        if (filtered.length === 0) filtered = candidates;
                        if (filtered.length > 0) {
                            const chosen = filtered[Math.floor(Math.random() * filtered.length)];
                            word = chosen.cleanTitle;
                            clue = await this.fetchWikipediaSummary(chosen.originalTitle, word);
                        }
                    }
                }
            } catch (err) {
                console.log("Pre-fetch word failed (using offline fallback)");
            }
        }
        
        if (word && /^[A-Z]+$/.test(word) && word.length >= 4 && word.length <= 8) {
            this.prefetchedData = {
                level: nextLevel,
                category: cat,
                word: word,
                clue: clue
            };
            console.log(`Pre-fetched word for Level ${nextLevel}: ${word}`);
        }
    }

    buildLevelArchetype() {
        // Clean out existing slot outlines and wood tiles
        document.querySelectorAll('.dashed-slot').forEach(el => el.remove());
        document.querySelectorAll('.wood-tile').forEach(el => el.remove());
        this.rackSlotsContainer.innerHTML = '';

        // Overlay target slots in the randomly chosen cell path
        this.targetCellIndices.forEach((cellIdx, i) => {
            const slot = document.createElement('div');
            slot.className = 'dashed-slot';
            slot.dataset.index = i;
            this.boardGrid.children[cellIdx].appendChild(slot);
        });

        // Create rack slots at bottom right
        for (let i = 0; i < this.targetWord.length; i++) {
            const slot = document.createElement('div');
            slot.className = 'rack-slot';
            slot.dataset.index = i;
            this.rackSlotsContainer.appendChild(slot);
        }

        this.boardGrid.offsetHeight; // reflow

        // Instantiate wooden tiles on the rack
        this.scrambledWord.split('').forEach((char, index) => {
            const tile = document.createElement('div');
            tile.className = 'wood-tile';
            tile.innerText = char;
            
            const dataObj = {
                element: tile,
                char: char,
                currentLocation: 'rack', // 'rack' or 'board'
                slotIndex: index // index of rack (0 to L-1) or board cell (0 to 99)
            };
            
            this.tilesData.push(dataObj);
            this.rackSlots[index] = dataObj;

            // Event bindings
            tile.addEventListener('mousedown', (e) => this.dragStart(e, dataObj));
            tile.addEventListener('touchstart', (e) => this.dragStart(e, dataObj), { passive: false });
            tile.addEventListener('click', () => {
                if (this.draggedDistance > 5) return;
                this.handleTileClick(dataObj);
            });

            document.body.appendChild(tile);
        });

        this.syncViewPositions(false);
    }

    handleTileClick(tileObj) {
        if (tileObj.element.classList.contains('locked')) return;
        this.sound.play('select');

        if (tileObj.currentLocation === 'rack') {
            // Find first empty target cell in the highlighted path
            let openCellIdx = -1;
            for (let i = 0; i < this.targetCellIndices.length; i++) {
                const cellIdx = this.targetCellIndices[i];
                if (this.boardOccupants[cellIdx] === null) {
                    openCellIdx = cellIdx;
                    break;
                }
            }

            // Fallback to any empty cell on the board if target slots are full
            if (openCellIdx === -1) {
                openCellIdx = this.boardOccupants.indexOf(null);
            }

            if (openCellIdx !== -1) {
                this.moveTileTo(tileObj, 'board', openCellIdx);
            }
        } else {
            // Return from board to the rack
            const openRackIdx = this.rackSlots.indexOf(null);
            if (openRackIdx !== -1) {
                this.moveTileTo(tileObj, 'rack', openRackIdx);
            }
        }
        this.syncViewPositions(true);
    }

    moveTileTo(tileObj, destination, index) {
        // Clear previous reference
        if (tileObj.currentLocation === 'rack') {
            this.rackSlots[tileObj.slotIndex] = null;
        } else {
            this.boardOccupants[tileObj.slotIndex] = null;
        }

        // Apply new location
        tileObj.currentLocation = destination;
        tileObj.slotIndex = index;

        if (destination === 'rack') {
            this.rackSlots[index] = tileObj;
            tileObj.element.classList.remove('inlaid');
        } else {
            this.boardOccupants[index] = tileObj;
            tileObj.element.classList.add('inlaid');
        }
    }

    syncViewPositions(animate = true) {
        if (!this.tilesData || this.tilesData.length === 0) return;

        const bodyRect = document.body.getBoundingClientRect();

        this.tilesData.forEach(tileObj => {
            let targetDOM = null;
            
            if (tileObj.currentLocation === 'rack') {
                targetDOM = this.rackSlotsContainer.children[tileObj.slotIndex];
            } else {
                targetDOM = this.boardGrid.children[tileObj.slotIndex];
            }

            if (!targetDOM) return;
            const rect = targetDOM.getBoundingClientRect();

            if (!animate) tileObj.element.style.transition = 'none';

            // Calculate dynamic tile size to fit grid-cells/slots responsively
            const pad = 2;
            const tileSize = rect.width - pad;
            tileObj.element.style.width = `${tileSize}px`;
            tileObj.element.style.height = `${tileSize}px`;
            tileObj.element.style.fontSize = `${tileSize * 0.55}px`;

            const offset = pad / 2;
            
            // Absolute coordinates relative to body to prevent viewport offsets/scroll gaps
            const x = rect.left - bodyRect.left + offset;
            const y = rect.top - bodyRect.top + offset;
            
            tileObj.element.style.transform = `translate3d(${x}px, ${y}px, 0px)`;

            if (!animate) {
                tileObj.element.offsetHeight; // flush
                tileObj.element.style.transition = '';
            }
        });
    }

    // --- DRAG AND DROP CONTROLS ---
    dragStart(e, tileObj) {
        if (tileObj.element.classList.contains('locked')) return;
        
        e.preventDefault();
        this.sound.play('select');
        this.activeDragTile = tileObj;
        this.draggedDistance = 0;
        
        const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;
        
        const tileRect = tileObj.element.getBoundingClientRect();
        this.dragOffset.x = clientX - tileRect.left;
        this.dragOffset.y = clientY - tileRect.top;
        this.dragStartRect = tileRect;

        tileObj.element.classList.add('dragging');
    }

    dragMove(e) {
        if (!this.activeDragTile) return;

        // Prevent viewport scroll during drag operations on mobile
        if (e.cancelable) {
            e.preventDefault();
        }

        const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;

        const dx = clientX - (this.dragOffset.x + this.dragStartRect.left);
        const dy = clientY - (this.dragOffset.y + this.dragStartRect.top);
        this.draggedDistance = Math.sqrt(dx*dx + dy*dy);

        const bodyRect = document.body.getBoundingClientRect();
        const x = clientX - this.dragOffset.x - bodyRect.left;
        const y = clientY - this.dragOffset.y - bodyRect.top;
        this.activeDragTile.element.style.transform = `translate3d(${x}px, ${y}px, 0px)`;

        const halfWidth = this.activeDragTile.element.offsetWidth / 2;
        const halfHeight = this.activeDragTile.element.offsetHeight / 2;
        this.updateDragHighlights(clientX - this.dragOffset.x + halfWidth, clientY - this.dragOffset.y + halfHeight);
    }

    dragEnd(e) {
        if (!this.activeDragTile) return;

        const tileObj = this.activeDragTile;
        tileObj.element.classList.remove('dragging');
        this.activeDragTile = null;

        // Clean layout highlights
        document.querySelectorAll('.dashed-slot').forEach(el => el.classList.remove('drag-hover'));

        // Mobile touch tap detection: if dragged distance is tiny, trigger tap-to-move
        if (this.draggedDistance < 10) {
            if (e && e.type === 'touchend') {
                e.preventDefault();
                this.handleTileClick(tileObj);
            }
            this.hoveredCell = null;
            return;
        }

        if (this.hoveredCell) {
            const destType = this.hoveredCell.type; // 'board' or 'rack'
            const destIdx = this.hoveredCell.index;

            // Check occupant in destination
            let occupant = destType === 'rack' ? this.rackSlots[destIdx] : this.boardOccupants[destIdx];

            if (occupant && occupant !== tileObj) {
                // Swap layout positions
                const srcLocation = tileObj.currentLocation;
                const srcIdx = tileObj.slotIndex;

                this.moveTileTo(tileObj, destType, destIdx);
                this.moveTileTo(occupant, srcLocation, srcIdx);
                this.sound.play('drop');
            } else {
                // Clear slot and move in
                this.moveTileTo(tileObj, destType, destIdx);
                this.sound.play('drop');
            }
        } else {
            // return to start
            this.sound.play('drop');
        }

        this.hoveredCell = null;
        this.syncViewPositions(true);
    }

    updateDragHighlights(cx, cy) {
        let bestCell = null;
        let minDist = 36; // Snapping radius threshold

        // 1. Scan board 10x10 squares
        Array.from(this.boardGrid.children).forEach(cell => {
            const rect = cell.getBoundingClientRect();
            const cellX = rect.left + rect.width / 2;
            const cellY = rect.top + rect.height / 2;
            const dist = Math.sqrt((cx - cellX)**2 + (cy - cellY)**2);
            
            if (dist < minDist) {
                minDist = dist;
                bestCell = {
                    type: 'board',
                    index: parseInt(cell.dataset.index),
                    element: cell
                };
            }
        });

        // 2. Scan rack slots
        Array.from(this.rackSlotsContainer.children).forEach((slot, index) => {
            const rect = slot.getBoundingClientRect();
            const slotX = rect.left + rect.width / 2;
            const slotY = rect.top + rect.height / 2;
            const dist = Math.sqrt((cx - slotX)**2 + (cy - slotY)**2);
            
            if (dist < minDist) {
                minDist = dist;
                bestCell = {
                    type: 'rack',
                    index: index,
                    element: slot
                };
            }
        });

        // Highlight slot outline if dragged over target cell paths
        document.querySelectorAll('.dashed-slot').forEach(el => el.classList.remove('drag-hover'));

        if (bestCell) {
            this.hoveredCell = bestCell;
            if (bestCell.type === 'board') {
                const innerSlot = bestCell.element.querySelector('.dashed-slot');
                if (innerSlot) {
                    innerSlot.classList.add('drag-hover');
                }
            }
        } else {
            this.hoveredCell = null;
        }
    }

    registerGlobalEvents() {
        window.addEventListener('mousemove', (e) => this.dragMove(e));
        window.addEventListener('touchmove', (e) => this.dragMove(e), { passive: false });
        
        window.addEventListener('mouseup', (e) => this.dragEnd(e));
        window.addEventListener('touchend', (e) => this.dragEnd(e));

        window.addEventListener('resize', () => this.syncViewPositions(false));
    }

    verifySolution() {
        // Read letters placed in the target cell path
        const playerWord = this.targetCellIndices.map(cellIdx => {
            const tile = this.boardOccupants[cellIdx];
            return tile ? tile.char : '';
        }).join('');

        if (playerWord === this.targetWord) {
            this.sound.play('win');
            this.tilesData.forEach(t => t.element.classList.add('locked'));
            
            // Trigger bounce effect sequentially on each letter from start to end
            this.targetCellIndices.forEach((cellIdx, i) => {
                const tileObj = this.boardOccupants[cellIdx];
                if (tileObj && tileObj.element) {
                    setTimeout(() => {
                        tileObj.element.classList.add('bounce-active');
                        // Remove class after animation finishes so it can be re-applied
                        tileObj.element.addEventListener('animationend', () => {
                            tileObj.element.classList.remove('bounce-active');
                        }, { once: true });
                    }, i * 100); // 100ms delay between each letter
                }
            });

            const badge = document.querySelector('.score-bubble');
            const badgeRect = badge.getBoundingClientRect();
            this.particles.burst(badgeRect.left + 30, badgeRect.top + 30);

            this.winStreak++;
            const streakBonus = this.getStreakBonus();
            this.score += 100 + streakBonus;
            this.scoreElement.innerText = this.score.toString().padStart(3, '0');
            if (this.streakElement) this.streakElement.innerText = this.winStreak;
            this.updateVictoryBreakdown(100, streakBonus);

            // Submit score to Stellar leaderboard (non-blocking)
            if (window.stellarWallet && window.stellarWallet.connected) {
                window.stellarWallet.submitScore(this.score, this.level);
            }

            setTimeout(() => {
                this.victoryScreen.classList.add('active');
            }, 1200); // Wait for the cascade bounce animation to finish beautifully
        } else {
            this.sound.play('error');
            this.winStreak = 0;
            if (this.streakElement) this.streakElement.innerText = this.winStreak;
            
            // Shake and highlight incorrect board tiles red
            this.tilesData.forEach(t => {
                if (t.currentLocation === 'board' && !t.element.classList.contains('locked')) {
                    t.element.style.transition = 'none';
                    t.element.style.backgroundColor = '#ef5350';
                    t.element.style.color = '#ffffff';
                    
                    const side = 5;
                    const tileX = parseFloat(t.element.style.transform.match(/translate3d\(([^px]+)px/)[1]);
                    const tileY = parseFloat(t.element.style.transform.match(/px, ([^px]+)px/)[1]);

                    let tick = 0;
                    const shakeInterval = setInterval(() => {
                        tick++;
                        const shakeOffset = (tick % 2 === 0 ? 1 : -1) * side;
                        t.element.style.transform = `translate3d(${tileX + shakeOffset}px, ${tileY}px, 0px)`;
                        if (tick >= 6) {
                            clearInterval(shakeInterval);
                            t.element.style.backgroundColor = '';
                            t.element.style.color = '';
                            t.element.style.transition = '';
                            this.syncViewPositions(true);
                        }
                    }, 40);
                }
            });
            
            this.mainBoard.classList.add('shake');
            setTimeout(() => this.mainBoard.classList.remove('shake'), 400);

            setTimeout(() => {
                // Progress clue level on incorrect submission
                if (this.clueLevel === 1) {
                    this.clueLevel = 2;
                    this.lockLetterAt(0); // Automatically lock first letter
                } else if (this.clueLevel === 2) {
                    this.clueLevel = 3;
                    this.clue3Exhausted = false;
                    this.lockLetterAt(this.targetWord.length - 1); // Automatically lock last letter
                } else if (this.clueLevel === 3) {
                    this.clue3Exhausted = true; // Exhausted state
                }
                this.showingPureDefinition = false;
                this.resetTray(true);
                this.updateClueUI();
            }, 500);
        }
    }

    resetTray(excludeLocked = true) {
        this.sound.play('reset');
        
        if (excludeLocked) {
            // Clear board occupants of non-locked tiles
            for (let i = 0; i < this.boardOccupants.length; i++) {
                const tileObj = this.boardOccupants[i];
                if (tileObj && !tileObj.element.classList.contains('locked')) {
                    this.boardOccupants[i] = null;
                }
            }
            
            // Reset rack slots to empty
            this.rackSlots.fill(null);
            
            // Put non-locked tiles back to rack
            let rackIdx = 0;
            this.tilesData.forEach((tileObj) => {
                if (tileObj.element.classList.contains('locked')) {
                    // It is locked, keep its board location as is
                    if (tileObj.currentLocation === 'board') {
                        this.boardOccupants[tileObj.slotIndex] = tileObj;
                    }
                } else {
                    // Not locked, send to rack
                    tileObj.currentLocation = 'rack';
                    tileObj.element.classList.remove('inlaid');
                    
                    // Find next empty rack slot
                    while (rackIdx < this.rackSlots.length && this.rackSlots[rackIdx] !== null) {
                        rackIdx++;
                    }
                    if (rackIdx < this.rackSlots.length) {
                        this.rackSlots[rackIdx] = tileObj;
                        tileObj.slotIndex = rackIdx;
                        rackIdx++;
                    }
                }
            });
        } else {
            // Full reset
            this.boardOccupants.fill(null);
            this.rackSlots.fill(null);
            this.tilesData.forEach((tileObj, index) => {
                tileObj.currentLocation = 'rack';
                tileObj.slotIndex = index;
                this.rackSlots[index] = tileObj;
                tileObj.element.classList.remove('inlaid');
                tileObj.element.classList.remove('locked');
            });
        }
        this.syncViewPositions(true);
    }

    lockLetterAt(charIndex) {
        // Return all unlocked tiles currently on the board back to the rack
        this.tilesData.forEach(tileObj => {
            if (tileObj.currentLocation === 'board' && !tileObj.element.classList.contains('locked')) {
                this.boardOccupants[tileObj.slotIndex] = null;
                tileObj.currentLocation = 'rack';
                tileObj.element.classList.remove('inlaid');
                
                const openRackIdx = this.rackSlots.indexOf(null);
                if (openRackIdx !== -1) {
                    this.rackSlots[openRackIdx] = tileObj;
                    tileObj.slotIndex = openRackIdx;
                }
            }
        });

        const targetCellIdx = this.targetCellIndices[charIndex];
        const correctChar = this.targetWord[charIndex];
        
        // 1. Kick out any incorrect tile currently sitting in that target cell
        const occupant = this.boardOccupants[targetCellIdx];
        if (occupant) {
            const openRackIdx = this.rackSlots.indexOf(null);
            if (openRackIdx !== -1) {
                this.moveTileTo(occupant, 'rack', openRackIdx);
            } else {
                const openBoardIdx = this.boardOccupants.indexOf(null);
                if (openBoardIdx !== -1) {
                    this.moveTileTo(occupant, 'board', openBoardIdx);
                }
            }
        }

        // 2. Locate the correct letter block (not currently locked)
        const correctTile = this.tilesData.find(t => t.char === correctChar && !t.element.classList.contains('locked'));
        
        if (correctTile) {
            // 3. Move correct tile to target cell
            this.moveTileTo(correctTile, 'board', targetCellIdx);
            // 4. Lock it
            correctTile.element.classList.add('locked');
            
            this.sound.play('drop');
            this.syncViewPositions(true);
            return true;
        }
        return false;
    }

    giveLetterHint() {
        if (this.clueLevel === 3) {
            this.sound.play('error');
            const panel = document.getElementById('clue-text');
            panel.innerText = "No more hints available for this scramble!";
            return;
        }

        this.sound.play('select');

        if (this.clueLevel === 1) {
            this.clueLevel = 2;
            this.lockLetterAt(0); // Reveal & lock first letter
            // Deduct 10 points
            this.score = Math.max(0, this.score - 10);
            this.scoreElement.innerText = this.score.toString().padStart(3, '0');
        } else if (this.clueLevel === 2) {
            this.clueLevel = 3;
            this.clue3Exhausted = false;
            this.lockLetterAt(this.targetWord.length - 1); // Reveal & lock last letter
            // Deduct 10 points
            this.score = Math.max(0, this.score - 10);
            this.scoreElement.innerText = this.score.toString().padStart(3, '0');
        }

        this.showingPureDefinition = false;
        this.resetTray(true);
        this.updateClueUI();
    }

    showWordClue() {
        this.sound.play('select');
        this.showingPureDefinition = !this.showingPureDefinition;
        if (this.showingPureDefinition) {
            const panel = document.getElementById('clue-text');
            panel.innerHTML = `<strong>Definition:</strong> ${this.wordClue}`;
            
            // Briefly scale the Clue 1 dot indicator
            const dot1 = document.querySelector(`.clue-dot[data-clue="1"]`);
            if (dot1) {
                dot1.style.transform = 'scale(1.2)';
                setTimeout(() => {
                    dot1.style.transform = '';
                }, 500);
            }
        } else {
            this.updateClueUI();
        }
        this.syncViewPositions(true);
    }

    updateClueUI() {
        const panel = document.getElementById('clue-text');
        if (!panel) return;

        // Update indicator dots active class
        for (let i = 1; i <= 3; i++) {
            const dot = document.querySelector(`.clue-dot[data-clue="${i}"]`);
            if (dot) {
                if (i <= this.clueLevel) {
                    dot.classList.add('active');
                } else {
                    dot.classList.remove('active');
                }
            }
        }

        const firstChar = this.targetWord[0];
        const lastChar = this.targetWord[this.targetWord.length - 1];
        const wordLength = this.targetWord.length;

        if (this.clueLevel === 1) {
            panel.innerHTML = `<strong>Definition:</strong> ${this.wordClue || 'Fetching definition...'}`;
        } else if (this.clueLevel === 2) {
            panel.innerHTML = `🔍 <strong>Clue 2:</strong> Starts with "${firstChar}" (${wordLength} letters)<br/><strong>Definition:</strong> ${this.wordClue}`;
        } else if (this.clueLevel === 3) {
            if (this.clue3Exhausted) {
                panel.innerHTML = `🚫 <strong>No clues left!</strong> You must solve: <strong>${firstChar}${'_'.repeat(wordLength - 2)}${lastChar}</strong><br/><strong>Definition:</strong> ${this.wordClue}`;
            } else {
                panel.innerHTML = `🔥 <strong>Trump Card:</strong> Starts with "${firstChar}", Ends with "${lastChar}" (${wordLength} letters)<br/><strong>Scrambled:</strong> <span style="letter-spacing: 2px;">${this.scrambledWord}</span><br/><strong>Definition:</strong> ${this.wordClue}`;
            }
        }
        this.syncViewPositions(true);
    }

    getStreakBonus() {
        const s = this.winStreak;
        if (s >= 16) return 50;
        if (s >= 11) return 30;
        if (s >= 6) return 20;
        if (s >= 1) return 10;
        return 0;
    }

    getStreakTierLabel(streak) {
        if (streak >= 16) return 'LEGENDARY STREAK (+50/win)';
        if (streak >= 11) return 'INFERNO STREAK (+30/win)';
        if (streak >= 6) return 'BLAZING STREAK (+20/win)';
        if (streak >= 1) return 'HOT STREAK (+10/win)';
        return '';
    }

    updateVictoryBreakdown(basePoints, streakBonus) {
        const breakdown = document.getElementById('victory-breakdown');
        if (!breakdown) return;
        const total = basePoints + streakBonus;
        let html = `<div class="breakdown-row"><span>Word Solved</span><span>+${basePoints}</span></div>`;
        if (streakBonus > 0) {
            html += `<div class="breakdown-row streak-row"><span>${this.getStreakTierLabel(this.winStreak)} x${this.winStreak}</span><span>+${streakBonus}</span></div>`;
        }
        html += `<div class="breakdown-divider"></div>`;
        html += `<div class="breakdown-row total-row"><span>Points Earned</span><span>+${total}</span></div>`;
        breakdown.innerHTML = html;
    }

    async nextLevel() {
        this.victoryScreen.classList.remove('active');
        this.particles.stop();
        
        this.level++;
        this.levelElement.innerText = this.level;
        
        document.getElementById('clue-text').innerText = "Preparing next scramble...";
        
        this.tilesData.forEach(t => t.element.remove());
        await this.runLoadingScreen(this.initLevel());
    }

    async runLoadingScreen(asyncTask) {
        const loadingScreen = document.getElementById('loading-screen');
        const progressBar = document.getElementById('loading-progress-bar');
        const statusText = document.getElementById('loading-status-text');
        const progressPercent = document.getElementById('loading-progress-percent');

        loadingScreen.classList.add('active');
        progressBar.style.width = '0%';
        progressPercent.innerText = '0%';
        statusText.innerText = 'Initializing...';

        let progress = 0;
        let isDone = false;
        
        // Progress bar simulation
        const progressInterval = setInterval(() => {
            if (isDone) {
                progress = 100;
                progressBar.style.width = '100%';
                progressPercent.innerText = '100%';
                clearInterval(progressInterval);
            } else {
                // Slower near the end for tension
                let increment = progress > 85 ? 0.3 : 4;
                progress += Math.random() * increment;
                if (progress > 90) progress = 90;
                progressBar.style.width = `${Math.floor(progress)}%`;
                progressPercent.innerText = `${Math.floor(progress)}%`;
            }
        }, 100);

        const statusPhrases = [
            'Accessing server core...',
            'Querying word database...',
            'Retrieving definitions...',
            'Compiling board matrix...',
            'Scrambling wooden tiles...'
        ];
        let phraseIdx = 0;
        const phraseInterval = setInterval(() => {
            if (isDone) {
                statusText.innerText = 'Scramble completed!';
                clearInterval(phraseInterval);
            } else {
                statusText.innerText = statusPhrases[phraseIdx % statusPhrases.length];
                phraseIdx++;
            }
        }, 400);

        try {
            await asyncTask;
        } catch (e) {
            console.error('Task failed during loading', e);
        } finally {
            isDone = true;
            progressBar.style.width = '100%';
            progressPercent.innerText = '100%';
            statusText.innerText = 'Completed!';
            
            clearInterval(progressInterval);
            clearInterval(phraseInterval);
            
            setTimeout(() => {
                loadingScreen.classList.remove('active');
                if (this.isEntranceLoad) {
                    this.isEntranceLoad = false;
                    setTimeout(() => {
                        this.openChangelogModal();
                    }, 400);
                }
            }, 300);
        }
    }

    toggleSound() {
        this.sound.toggleMute();
    }

    openCategoryModal() {
        this.sound.play('select');
        document.getElementById('category-modal-backdrop').classList.add('active');
    }

    closeCategoryModal(event) {
        if (!event || event.target === document.getElementById('category-modal-backdrop')) {
            this.sound.play('select');
            document.getElementById('category-modal-backdrop').classList.remove('active');
        }
    }

    openChangelogModal() {
        this.sound.play('select');
        document.getElementById('changelog-modal-backdrop').classList.add('active');
    }

    closeChangelogModal(event) {
        if (!event || event.target === document.getElementById('changelog-modal-backdrop')) {
            this.sound.play('select');
            document.getElementById('changelog-modal-backdrop').classList.remove('active');
        }
    }

    openThemeModal() {
        this.sound.play('select');
        document.getElementById('theme-modal-backdrop').classList.add('active');
        
        // Lazy load theme preview images on modal open
        document.querySelectorAll('.theme-modal img[data-src]').forEach(img => {
            img.src = img.getAttribute('data-src');
            img.removeAttribute('data-src');
        });

        // Update the current selection state in the cards
        document.querySelectorAll('.theme-card').forEach(card => {
            card.classList.remove('current');
        });
        const activeCard = document.getElementById(`theme-card-${this.currentTheme}`);
        if (activeCard) activeCard.classList.add('current');
    }

    closeThemeModal(event) {
        if (!event || event.target === document.getElementById('theme-modal-backdrop')) {
            this.sound.play('select');
            document.getElementById('theme-modal-backdrop').classList.remove('active');
        }
    }

    switchTheme(themeId) {
        if (themeId === this.currentTheme) {
            document.getElementById('theme-modal-backdrop').classList.remove('active');
            return;
        }

        this.sound.play('win');
        this.currentTheme = themeId;
        localStorage.setItem('word_scramble_theme', themeId);

        // Update card highlight
        document.querySelectorAll('.theme-card').forEach(card => {
            card.classList.remove('current');
        });
        const activeCard = document.getElementById(`theme-card-${themeId}`);
        if (activeCard) activeCard.classList.add('current');

        this.applyTheme(themeId, true);
        document.getElementById('theme-modal-backdrop').classList.remove('active');
    }

    applyTheme(themeId, animate = true) {
        if (themeId === 'teak') {
            document.body.removeAttribute('data-theme');
        } else {
            document.body.setAttribute('data-theme', themeId);
        }

        // Give the DOM a moment to adjust to theme styles, then sync wood tile positions
        setTimeout(() => {
            this.syncViewPositions(animate);
        }, 120);
    }

    openChipModal() {
        this.sound.play('select');
        document.getElementById('chip-modal-backdrop').classList.add('active');
        
        // Update active class on the chip cards
        document.querySelectorAll('#chip-modal-backdrop .theme-card').forEach(card => {
            card.classList.remove('current');
        });
        const activeCard = document.getElementById(`chip-card-${this.currentChipMaterial}`);
        if (activeCard) activeCard.classList.add('current');
    }

    closeChipModal(event) {
        if (!event || event.target === document.getElementById('chip-modal-backdrop')) {
            this.sound.play('select');
            document.getElementById('chip-modal-backdrop').classList.remove('active');
        }
    }

    switchChipMaterial(materialId) {
        if (materialId === this.currentChipMaterial) {
            document.getElementById('chip-modal-backdrop').classList.remove('active');
            return;
        }

        this.sound.play('win');
        this.currentChipMaterial = materialId;
        localStorage.setItem('word_scramble_chip_material', materialId);

        // Update active highlight
        document.querySelectorAll('#chip-modal-backdrop .theme-card').forEach(card => {
            card.classList.remove('current');
        });
        const activeCard = document.getElementById(`chip-card-${materialId}`);
        if (activeCard) activeCard.classList.add('current');

        this.applyChipMaterial(materialId, true);
        document.getElementById('chip-modal-backdrop').classList.remove('active');
    }

    applyChipMaterial(materialId, animate = true) {
        document.body.setAttribute('data-chip-material', materialId);

        // Update tile positions since margins/borders might have adjusted
        setTimeout(() => {
            this.syncViewPositions(animate);
        }, 120);
    }

    async switchCategory(category) {
        if (category === this.currentCategory && this.tilesData.length > 0) {
            document.getElementById('category-modal-backdrop').classList.remove('active');
            return;
        }

        this.sound.play('select');
        document.getElementById('category-modal-backdrop').classList.remove('active');

        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('current');
        });
        const btnId = `cat-btn-${category}`;
        const targetBtn = document.getElementById(btnId);
        if (targetBtn) targetBtn.classList.add('current');

        const tagBtn = document.getElementById('category-tag-btn');
        if (tagBtn) {
            const prettyNames = {
                general: 'General',
                science: 'Science',
                math: 'Mathematics',
                history: 'History',
                anime: 'Anime Series',
                technology: 'Technology',
                novel: 'Novels',
                'filipino-movies': 'Filipino Movies'
            };
            tagBtn.innerText = `Category: ${prettyNames[category] || category}`;
        }

        this.currentCategory = category;
        this.winStreak = 0;
        if (this.streakElement) this.streakElement.innerText = this.winStreak;

        // Clear pre-fetched data since we changed category
        this.prefetchedData = null;

        // Clean current tiles
        this.tilesData.forEach(t => t.element.remove());
        this.tilesData = [];

        await this.runLoadingScreen(this.initLevel());
    }

    async fetchDictionaryDefinition(word) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            const defRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (defRes.ok) {
                const defData = await defRes.json();
                if (defData && defData[0] && defData[0].meanings && defData[0].meanings[0]) {
                    const firstMeaning = defData[0].meanings[0];
                    const firstDef = firstMeaning.definitions[0].definition;
                    return `[${firstMeaning.partOfSpeech}] ${firstDef}`;
                }
            }
        } catch (err) {
            console.log("Free Dictionary definition fetch failed (using fallback clue)");
        }
        return "";
    }

    async fetchWikipediaSummary(pageTitle, cleanWord) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (response.ok) {
                const data = await response.json();
                if (data && data.extract) {
                    return data.extract;
                }
            }
        } catch (err) {
            console.log("Wikipedia summary fetch failed (using fallback clue)");
        }
        return "";
    }

    censorWordInClue(clue, word) {
        if (!clue) return "";
        let censored = clue;
        const escapedWord = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regexWord = new RegExp(escapedWord, 'gi');
        censored = censored.replace(regexWord, '____');
        return censored;
    }
}

// Instantiate game engine on DOMContentLoaded
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new TeakScrambleGame();
});
