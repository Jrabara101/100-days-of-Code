/**
 * Headless Go Fish Card Engine with Statistical Inference Memory Ledger
 * and Phase-Locked FSM for asynchronous turn animations.
 */
export class GoFishEngine {
  constructor(onStateChange, onAudioTrigger) {
    this.onStateChange = onStateChange;
    this.onAudioTrigger = onAudioTrigger || (() => {});
    
    // 0: Human Player, 1: AI Opponent
    this.hands = [[], []]; 
    this.books = [[], []]; // Array of completed rank strings e.g. ['8', 'A']
    this.stockPile = [];
    
    this.turn = 0; // 0 = Player, 1 = AI
    this.gameState = 'DEALING'; // DEALING, ASK_SELECT, ANIMATING, RESOLVE, GAME_OVER
    this.log = ['> SHUFFLING 52-CARD RETRO SHOE...'];
    this.turnCount = 0;
    
    // AI Memory Ledger tracking player inquiries
    // Format: { '8': { count: 1, known: true, turnAsked: 3 }, ... }
    this.aiMemory = {};
    
    // Animation lock state for React presentation layer
    this.activeAnimation = null; // { type: 'HANDOVER'|'GO_FISH'|'BOOK', rank: '8', count: 2, from: 1, to: 0 }

    this.initNewGame();
  }

  initNewGame() {
    const suits = ['♠', '♥', '♣', '♦'];
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    
    let deck = [];
    suits.forEach(s => {
      ranks.forEach(r => {
        deck.push({ 
          id: `${r}-${s}-${Math.random().toString(36).substring(2, 6)}`, 
          rank: r, 
          suit: s, 
          isRed: (s === '♥' || s === '♦') 
        });
      });
    });

    // Fisher-Yates Shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    this.stockPile = deck;
    this.hands = [[], []];
    this.books = [[], []];
    this.turn = 0;
    this.turnCount = 0;
    this.aiMemory = {};
    this.activeAnimation = null;

    this.addLog('> Dealing 7 cards to each player...');
    this.onAudioTrigger('deal');

    // Deal 7 cards each
    for (let i = 0; i < 7; i++) {
      if (this.stockPile.length > 0) this.hands[0].push(this.stockPile.pop());
      if (this.stockPile.length > 0) this.hands[1].push(this.stockPile.pop());
    }

    // Sort Player's hand for clean UX (Ranks low to high)
    this.sortHand(0);

    // Initial 4-of-a-kind check
    this.checkForBooks(0);
    this.checkForBooks(1);

    this.gameState = 'ASK_SELECT';
    this.addLog('> Game initialized. Choose a card rank to ask AI.');
    this.notifyReact();
  }

  sortHand(playerIdx) {
    const rankOrder = { '2':2, '3':3, '4':4, '5':5, '6':6, '7':7, '8':8, '9':9, '10':10, 'J':11, 'Q':12, 'K':13, 'A':14 };
    this.hands[playerIdx].sort((a, b) => rankOrder[a.rank] - rankOrder[b.rank]);
  }

  checkForBooks(playerIdx) {
    const hand = this.hands[playerIdx];
    const rankCounts = {};
    
    hand.forEach(card => {
      rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
    });

    let bookFound = false;
    Object.entries(rankCounts).forEach(([rank, count]) => {
      if (count === 4) {
        // Extract all 4 cards of this rank
        this.hands[playerIdx] = hand.filter(c => c.rank !== rank);
        this.books[playerIdx].push(rank);
        
        // Clear this rank from AI memory
        delete this.aiMemory[rank];

        const owner = playerIdx === 0 ? 'You' : 'AI Opponent';
        this.addLog(`📚 ${owner} completed a 4-of-a-kind Book of [${rank}]s!`);
        this.onAudioTrigger('book');
        bookFound = true;
      }
    });

    if (bookFound) {
      this.notifyReact();
    }
    return bookFound;
  }

  // Refill hand if empty from stock
  ensureHandNotEmpty(playerIdx) {
    if (this.hands[playerIdx].length === 0 && this.stockPile.length > 0) {
      const drawn = this.stockPile.pop();
      this.hands[playerIdx].push(drawn);
      const owner = playerIdx === 0 ? 'You' : 'AI';
      this.addLog(`📥 ${owner}'s hand was empty. Drew 1 card [${playerIdx === 0 ? drawn.rank + drawn.suit : '?'}] from stock.`);
      if (playerIdx === 0) this.sortHand(0);
      this.checkForBooks(playerIdx);
    }
  }

  // --- CORE GO FISH GAME ENGINE PROCESS ---
  processAsk(askingPlayer, rank) {
    if (this.gameState !== 'ASK_SELECT' && this.gameState !== 'RESOLVE') return;
    
    // Phase Lock FSM during animation
    this.gameState = 'ANIMATING';
    this.turnCount++;

    const defendingPlayer = askingPlayer === 0 ? 1 : 0;
    const defenderHand = this.hands[defendingPlayer];
    const matchingCards = defenderHand.filter(c => c.rank === rank);

    const askingName = askingPlayer === 0 ? 'You' : 'AI';
    const defendingName = defendingPlayer === 0 ? 'You' : 'AI';

    this.addLog(`${askingPlayer === 0 ? '👤 YOU' : '🤖 AI'} asked: "Do you have any [${rank}]s?"`);

    // STATISTICAL INFERENCE LEDGER UPDATE:
    // If Player 0 asked for rank R, AI notes that Player 0 MUST hold at least one R in hand.
    if (askingPlayer === 0) {
      this.aiMemory[rank] = {
        count: Math.max(1, (this.aiMemory[rank]?.count || 0)),
        known: true,
        inferred: false,
        turnAsked: this.turnCount
      };
      this.addLog(`🧠 [AI Ledger] Recorded: Player holds at least one [${rank}].`);
    }

    if (matchingCards.length > 0) {
      // SUCCESSFUL ASK: Defender yields all matching cards
      this.activeAnimation = {
        type: 'HANDOVER',
        from: defendingPlayer,
        to: askingPlayer,
        rank: rank,
        count: matchingCards.length,
        cards: matchingCards
      };

      this.onAudioTrigger('askSuccess');
      this.notifyReact();

      // Delay state resolution for smooth card slide animation
      setTimeout(() => {
        // Transfer cards
        this.hands[defendingPlayer] = defenderHand.filter(c => c.rank !== rank);
        this.hands[askingPlayer].push(...matchingCards);
        if (askingPlayer === 0) this.sortHand(0);

        this.addLog(`✨ SUCCESS! ${defendingName} handed over ${matchingCards.length} card(s) of rank [${rank}].`);

        // Update AI Memory: If AI received cards from player, player now has 0 of rank R
        if (askingPlayer === 1) {
          delete this.aiMemory[rank];
        }

        // Check for completed books
        this.checkForBooks(askingPlayer);
        this.ensureHandNotEmpty(askingPlayer);
        this.ensureHandNotEmpty(defendingPlayer);

        this.activeAnimation = null;
        this.checkWinCondition();

        if (this.gameState !== 'GAME_OVER') {
          this.addLog(`🔄 ${askingName} gets another turn!`);
          this.turn = askingPlayer;

          if (askingPlayer === 1) {
            this.gameState = 'RESOLVE';
            setTimeout(() => this.executeAITurn(), 1000);
          } else {
            this.gameState = 'ASK_SELECT';
          }
        }
        this.notifyReact();
      }, 900);

    } else {
      // GO FISH!
      this.activeAnimation = {
        type: 'GO_FISH',
        askingPlayer: askingPlayer,
        rank: rank
      };

      this.onAudioTrigger('goFish');
      this.addLog(`🌊 ${defendingName} says: "GO FISH!"`);
      this.notifyReact();

      setTimeout(() => {
        if (this.stockPile.length > 0) {
          const drawnCard = this.stockPile.pop();
          this.hands[askingPlayer].push(drawnCard);
          if (askingPlayer === 0) this.sortHand(0);

          this.addLog(`${askingName} drew 1 card from the stock pile.`);

          // If AI drew card and was asking, update memory
          this.checkForBooks(askingPlayer);
          this.ensureHandNotEmpty(askingPlayer);

          // Rule: If you draw the exact rank you asked for, you get another turn!
          if (drawnCard.rank === rank) {
            this.addLog(`🎉 LUCKY FISH! Drew the requested rank [${rank}]! Turn retained.`);
            this.activeAnimation = null;
            this.checkWinCondition();

            if (this.gameState !== 'GAME_OVER') {
              this.turn = askingPlayer;
              if (askingPlayer === 1) {
                this.gameState = 'RESOLVE';
                setTimeout(() => this.executeAITurn(), 1000);
              } else {
                this.gameState = 'ASK_SELECT';
              }
            }
            this.notifyReact();
            return;
          }
        } else {
          this.addLog(`⚠️ Stock pile is empty! No cards drawn.`);
        }

        this.activeAnimation = null;
        this.checkWinCondition();

        if (this.gameState !== 'GAME_OVER') {
          // Switch Turn
          this.turn = defendingPlayer;
          this.addLog(`👉 Turn passes to ${this.turn === 0 ? 'YOU' : 'AI OPPONENT'}.`);

          if (this.turn === 1) {
            this.gameState = 'RESOLVE';
            setTimeout(() => this.executeAITurn(), 1000);
          } else {
            this.gameState = 'ASK_SELECT';
          }
        }
        this.notifyReact();
      }, 900);
    }
  }

  // --- STATISTICAL INFERENCE AI BRAIN ---
  executeAITurn() {
    if (this.gameState === 'GAME_OVER') return;

    this.ensureHandNotEmpty(1);
    const aiHand = this.hands[1];

    if (aiHand.length === 0) {
      this.checkWinCondition();
      return;
    }

    // AI inspects unique ranks in its hand
    const uniqueRanksInHand = [...new Set(aiHand.map(c => c.rank))];
    
    // HEURISTIC LEVEL 1: Statistical Recall Search
    // Check if AI holds any rank that is registered in aiMemory (meaning player asked for it earlier!)
    let chosenRank = null;
    let decisionReason = '';

    for (const rank of uniqueRanksInHand) {
      if (this.aiMemory[rank] && this.aiMemory[rank].known && this.aiMemory[rank].count > 0) {
        chosenRank = rank;
        decisionReason = `🧠 INFERENCE: Recalled player asked for [${rank}] on turn ${this.aiMemory[rank].turnAsked}!`;
        break;
      }
    }

    // HEURISTIC LEVEL 2: Frequency Count
    // If no direct memory hit, pick rank in AI hand with highest count
    if (!chosenRank) {
      const counts = {};
      aiHand.forEach(c => counts[c.rank] = (counts[c.rank] || 0) + 1);
      
      // Sort ranks by count descending
      uniqueRanksInHand.sort((a, b) => counts[b] - counts[a]);
      chosenRank = uniqueRanksInHand[0];

      if (counts[chosenRank] > 1) {
        decisionReason = `📊 TACTICS: Holds ${counts[chosenRank]} of rank [${chosenRank}].`;
      } else {
        decisionReason = `🎲 PROBABILITY: Picked singleton rank [${chosenRank}] from hand.`;
      }
    }

    this.addLog(`🤖 AI Decision Engine: ${decisionReason}`);
    this.processAsk(1, chosenRank);
  }

  checkWinCondition() {
    const totalBooks = this.books[0].length + this.books[1].length;
    const handsEmpty = (this.hands[0].length === 0 && this.hands[1].length === 0);
    
    if (totalBooks === 13 || (this.stockPile.length === 0 && handsEmpty)) {
      this.gameState = 'GAME_OVER';
      const p1Books = this.books[0].length;
      const p2Books = this.books[1].length;
      
      let winner = 'PLAYER';
      if (p2Books > p1Books) winner = 'AI';
      else if (p1Books === p2Books) winner = 'TIE';

      this.addLog(`🏆 GAME OVER! Final Score - YOU: ${p1Books} | AI: ${p2Books}`);
      
      if (winner === 'PLAYER') this.onAudioTrigger('win');
      else if (winner === 'AI') this.onAudioTrigger('gameOver');
    }
  }

  addLog(msg) {
    const timestamp = new Date().toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' });
    this.log = [`[${timestamp}] ${msg}`, ...this.log.slice(0, 25)];
  }

  notifyReact() {
    // ENFORCE INFORMATION ASYMMETRY:
    // AI hand is exposed ONLY as count/length, not raw card objects to UI
    this.onStateChange({
      playerHand: [...this.hands[0]],
      aiHandCount: this.hands[1].length,
      playerBooks: [...this.books[0]],
      aiBooks: [...this.books[1]],
      stockCount: this.stockPile.length,
      turn: this.turn,
      gameState: this.gameState,
      log: [...this.log],
      aiMemory: JSON.parse(JSON.stringify(this.aiMemory)),
      activeAnimation: this.activeAnimation ? { ...this.activeAnimation } : null
    });
  }
}
