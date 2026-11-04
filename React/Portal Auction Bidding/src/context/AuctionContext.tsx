import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { 
  LotItem, 
  BidRecord, 
  TimelineEntry, 
  BidderPaddle, 
  HammerSettlement, 
  EscrowStage,
  calculateDynamicMinIncrement,
  calculateBuyerPremium,
  calculateEstimatedShipping
} from '../types/auction';
import { 
  INITIAL_LOTS, 
  INITIAL_BIDS_LOT_041, 
  INITIAL_TIMELINE_LOT_041, 
  INITIAL_SETTLEMENT 
} from '../data/mockLots';
import { soundManager } from '../utils/soundEffects';

interface AuctionContextType {
  // Navigation & View State
  activeView: 'portal' | 'terminal' | 'studio' | 'settlement';
  setActiveView: (view: 'portal' | 'terminal' | 'studio' | 'settlement') => void;
  selectedLotId: string;
  setSelectedLotId: (id: string) => void;
  selectedLot: LotItem | undefined;
  
  // Data
  lots: LotItem[];
  bidsMap: Record<string, BidRecord[]>;
  timelineMap: Record<string, TimelineEntry[]>;
  settlements: HammerSettlement[];
  
  // User & Paddle
  currentUser: {
    id: string;
    name: string;
    paddle: BidderPaddle;
  };
  updatePaddle: (paddleData: Partial<BidderPaddle>) => void;
  isPaddleModalOpen: boolean;
  setIsPaddleModalOpen: (open: boolean) => void;
  isArchitectureModalOpen: boolean;
  setIsArchitectureModalOpen: (open: boolean) => void;
  
  // Active User Proxy Ceilings
  userProxyCeilings: Record<string, number>; // lotId -> maxCeilingCents
  
  // Sound & Theme
  isSoundMuted: boolean;
  toggleSound: () => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  
  // Actions
  placeBid: (lotId: string, bidAmountCents: number, proxyCeilingCents?: number) => {
    success: boolean;
    isLeading: boolean;
    wasOutbid: boolean;
    softCloseExtended: boolean;
    proxyDefended: boolean;
    message: string;
  };
  simulateRivalBid: (lotId: string) => void;
  fastForwardClock: (lotId: string, secondsRemaining: number) => void;
  dropReserve: (lotId: string) => void;
  triggerHammerFall: (lotId: string) => void;
  
  // Q&A & Timeline
  postQuestion: (lotId: string, body: string) => void;
  answerQuestion: (lotId: string, replyToId: string, body: string, pinToSpecs: boolean) => void;
  upvoteTimelineEntry: (lotId: string, entryId: string) => void;
  
  // Escrow & Settlements
  updateSettlementStage: (settlementId: string, stage: EscrowStage) => void;
  updateCarrierTracking: (settlementId: string, carrier: string, trackingNumber: string) => void;
  
  // Ephemeral Alert States for Micro-Interactions
  lastOutbidLotId: string | null;
  lastPopcornExtendedLotId: string | null;
  lastProxyDefendedLotId: string | null;
}

const AuctionContext = createContext<AuctionContextType | null>(null);

export const AuctionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Views
  const [activeView, setActiveView] = useState<'portal' | 'terminal' | 'studio' | 'settlement'>('portal');
  const [selectedLotId, setSelectedLotId] = useState<string>('lot-041');
  
  // Lots state
  const [lots, setLots] = useState<LotItem[]>(INITIAL_LOTS);
  
  // Bids map
  const [bidsMap, setBidsMap] = useState<Record<string, BidRecord[]>>({
    'lot-041': INITIAL_BIDS_LOT_041,
  });

  // Timeline map
  const [timelineMap, setTimelineMap] = useState<Record<string, TimelineEntry[]>>({
    'lot-041': INITIAL_TIMELINE_LOT_041,
  });

  // Settlements
  const [settlements, setSettlements] = useState<HammerSettlement[]>([INITIAL_SETTLEMENT]);

  // Current User & Paddle #4092
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    name: string;
    paddle: BidderPaddle;
  }>({
    id: 'bidder-current-user',
    name: 'Alexander Sterling',
    paddle: {
      id: 'paddle-4092',
      userId: 'bidder-current-user',
      paddleNumber: '#4092',
      heldDepositCents: 100000, // $1,000.00
      biddingLimitCents: 5000000, // $50,000.00
      holdStatus: 'active_authorized',
      isVerified: true,
      userName: 'Alexander Sterling',
      email: 'alex.sterling@meridian-vault.com',
      cardLast4: '4092',
      verifiedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
  });

  // Proxy ceilings
  const [userProxyCeilings, setUserProxyCeilings] = useState<Record<string, number>>({
    'lot-041': 2700000, // Pre-authorized $27,000 proxy ceiling on Lot #041
  });

  // Hidden rival proxy ceilings (server-side vault simulation)
  const [rivalProxyCeilings, setRivalProxyCeilings] = useState<Record<string, { bidderId: string; paddle: string; maxCents: number }>>({
    'lot-041': { bidderId: 'bidder-rival-8812', paddle: '#8812', maxCents: 2500000 }, // Rival max is $25,000
  });

  // Modals
  const [isPaddleModalOpen, setIsPaddleModalOpen] = useState(false);
  const [isArchitectureModalOpen, setIsArchitectureModalOpen] = useState(false);

  // Sound
  const [isSoundMuted, setIsSoundMuted] = useState(() => soundManager.getIsMuted());

  // Theme
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Micro-interaction flash state
  const [lastOutbidLotId, setLastOutbidLotId] = useState<string | null>(null);
  const [lastPopcornExtendedLotId, setLastPopcornExtendedLotId] = useState<string | null>(null);
  const [lastProxyDefendedLotId, setLastProxyDefendedLotId] = useState<string | null>(null);

  // Sync theme to document
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleSound = useCallback(() => {
    const muted = soundManager.toggleMute();
    setIsSoundMuted(muted);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  const updatePaddle = useCallback((paddleData: Partial<BidderPaddle>) => {
    setCurrentUser(prev => ({
      ...prev,
      paddle: {
        ...prev.paddle,
        ...paddleData,
      },
    }));
    soundManager.playPaddleUnlocked();
  }, []);

  const selectedLot = useMemo(() => {
    return lots.find(l => l.id === selectedLotId);
  }, [lots, selectedLotId]);

  // Fast-Forward countdown clock for testing Popcorn Overtime
  const fastForwardClock = useCallback((lotId: string, secondsRemaining: number) => {
    setLots(prev => prev.map(lot => {
      if (lot.id !== lotId) return lot;
      const newEndsAt = new Date(Date.now() + secondsRemaining * 1000).toISOString();
      return {
        ...lot,
        endsAt: newEndsAt,
      };
    }));
  }, []);

  // Consignor "Drop the Reserve" action
  const dropReserve = useCallback((lotId: string) => {
    setLots(prev => prev.map(lot => {
      if (lot.id !== lotId) return lot;
      return {
        ...lot,
        reservePriceCents: lot.currentBidCents,
        reserveStatus: 'reserve_met',
      };
    }));

    // Add milestone entry in timeline
    const milestone: TimelineEntry = {
      id: `milestone-${Date.now()}`,
      lotId,
      authorId: 'sys-consignor',
      authorName: 'Official Consignor Action',
      authorRole: 'seller',
      entryType: 'reserve_lowered_event',
      body: '🔓 The consignor has officially lowered the reserve to the current high bid! The lot is now GUARANTEED to sell at hammer fall. Bidding frenzy unlocked!',
      isPinned: true,
      upvotesCount: 31,
      createdAt: new Date().toISOString(),
    };

    setTimelineMap(prev => ({
      ...prev,
      [lotId]: [milestone, ...(prev[lotId] || [])],
    }));

    soundManager.playBidSuccessChime();
  }, []);

  // Hammer Fall Finale
  const triggerHammerFall = useCallback((lotId: string) => {
    const targetLot = lots.find(l => l.id === lotId);
    if (!targetLot || targetLot.status === 'sold_hammer') return;

    soundManager.playGavelStrike();
    
    // Confetti celebration
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10B981', '#34D399', '#FBBF24', '#60A5FA'],
      });
    } catch {
      // ignore
    }

    setLots(prev => prev.map(lot => {
      if (lot.id !== lotId) return lot;
      return {
        ...lot,
        status: 'sold_hammer',
        closedAt: new Date().toISOString(),
      };
    }));

    // Generate settlement record
    const buyerPremiumCents = calculateBuyerPremium(targetLot.currentBidCents);
    const shippingInsuredCents = calculateEstimatedShipping(targetLot.currentBidCents, targetLot.category);
    const depositApplied = currentUser.paddle.heldDepositCents;
    const totalBuyerDue = targetLot.currentBidCents + buyerPremiumCents + shippingInsuredCents - depositApplied;
    const sellerCommission = Math.round(targetLot.currentBidCents * 0.05);
    const sellerNet = targetLot.currentBidCents - sellerCommission;

    const newSettlement: HammerSettlement = {
      id: `stl-${Date.now()}`,
      settlementNumber: `STL-2026-${Math.floor(100 + Math.random() * 900)}`,
      lotId: targetLot.id,
      lotTitle: targetLot.title,
      winnerId: targetLot.leadingBidderId || currentUser.id,
      winnerPaddleNumber: targetLot.leadingPaddleNumber || currentUser.paddle.paddleNumber,
      sellerId: targetLot.sellerId,
      sellerName: targetLot.sellerName,
      hammerPriceCents: targetLot.currentBidCents,
      buyerPremiumCents,
      shippingInsuredCents,
      depositAppliedCents: depositApplied,
      totalBuyerDueCents: Math.max(0, totalBuyerDue),
      sellerCommissionCents: sellerCommission,
      sellerNetPayoutCents: sellerNet,
      escrowStage: 'funds_in_escrow',
      trackingNumber: `CARRIER-EXP-${Math.floor(100000 + Math.random() * 900000)}`,
      carrier: 'Armored & Insured Global Transport',
      payoutTraceId: `STRIPE_ESCROW_TR_${Math.floor(10000000 + Math.random() * 90000000)}`,
      createdAt: new Date().toISOString(),
    };

    setSettlements(prev => [newSettlement, ...prev.filter(s => s.lotId !== lotId)]);

    // Log timeline announcement
    const soldEntry: TimelineEntry = {
      id: `sold-${Date.now()}`,
      lotId,
      authorId: 'sys-gavel',
      authorName: 'Auctio Vault Auctioneer',
      authorRole: 'system',
      entryType: 'system_milestone',
      body: `🔨 HAMMER FALLEN! Sold for $${(targetLot.currentBidCents / 100).toLocaleString()} to Paddle ${targetLot.leadingPaddleNumber || currentUser.paddle.paddleNumber}. Post-hammer escrow settlement initiated.`,
      isPinned: true,
      upvotesCount: 48,
      createdAt: new Date().toISOString(),
    };

    setTimelineMap(prev => ({
      ...prev,
      [lotId]: [soldEntry, ...(prev[lotId] || [])],
    }));
  }, [lots, currentUser]);

  // Main Atomic Bidding Engine (matches place_bid_atomic PL/pgSQL function)
  const placeBid = useCallback((
    lotId: string, 
    bidAmountCents: number, 
    proxyCeilingCents?: number
  ) => {
    const lot = lots.find(l => l.id === lotId);
    if (!lot) {
      return { success: false, isLeading: false, wasOutbid: false, softCloseExtended: false, proxyDefended: false, message: 'Lot not found' };
    }

    if (!currentUser.paddle.isVerified || currentUser.paddle.holdStatus !== 'active_authorized') {
      setIsPaddleModalOpen(true);
      return { success: false, isLeading: false, wasOutbid: false, softCloseExtended: false, proxyDefended: false, message: 'Verified Paddle required' };
    }

    if (bidAmountCents < lot.nextMinBidCents) {
      return { success: false, isLeading: false, wasOutbid: false, softCloseExtended: false, proxyDefended: false, message: `Minimum required bid is $${(lot.nextMinBidCents / 100).toLocaleString()}` };
    }

    const nowMs = Date.now();
    const endsMs = new Date(lot.endsAt).getTime();
    const remainingMs = endsMs - nowMs;

    let softCloseExtended = false;
    let newEndsAt = lot.endsAt;

    // Popcorn Soft-Close Check: if bid placed with < 120s remaining, extend clock back to 120s
    if (remainingMs < 120000) {
      softCloseExtended = true;
      newEndsAt = new Date(nowMs + 120000).toISOString();
      setLastPopcornExtendedLotId(lotId);
      setTimeout(() => setLastPopcornExtendedLotId(null), 1500);
      soundManager.playPopcornResetChime();
    }

    // Save user's proxy ceiling if provided
    if (proxyCeilingCents && proxyCeilingCents >= bidAmountCents) {
      setUserProxyCeilings(prev => ({
        ...prev,
        [lotId]: proxyCeilingCents,
      }));
    }

    // Check rival proxy ceiling (Vickrey auto-stepping)
    const rival = rivalProxyCeilings[lotId];
    if (rival && rival.maxCents >= bidAmountCents) {
      // Rival proxy absorbs the challenge!
      const minInc = calculateDynamicMinIncrement(bidAmountCents);
      const rivalCounterCents = Math.min(rival.maxCents, bidAmountCents + minInc);

      // 1. Log challenger's bid
      const challengerBid: BidRecord = {
        id: `bid-${Date.now()}-ch`,
        lotId,
        bidderId: currentUser.id,
        paddleNumber: currentUser.paddle.paddleNumber,
        amountCents: bidAmountCents,
        isProxyAutoBid: false,
        triggeredSoftCloseExtension: softCloseExtended,
        previousEndsAt: lot.endsAt,
        newEndsAt,
        createdAt: new Date().toISOString(),
        bidderTitle: `${currentUser.name} (Direct)`,
      };

      // 2. Log rival's instant auto-defense bid
      const rivalAutoBid: BidRecord = {
        id: `bid-${Date.now()}-rv`,
        lotId,
        bidderId: rival.bidderId,
        paddleNumber: rival.paddle,
        amountCents: rivalCounterCents,
        isProxyAutoBid: true,
        triggeredSoftCloseExtension: false,
        previousEndsAt: lot.endsAt,
        newEndsAt,
        createdAt: new Date(Date.now() + 150).toISOString(),
        bidderTitle: `Auto-Proxy Step (${rival.paddle})`,
      };

      setBidsMap(prev => ({
        ...prev,
        [lotId]: [rivalAutoBid, challengerBid, ...(prev[lotId] || [])],
      }));

      // Update lot with rival still leading
      const nextReq = rivalCounterCents + calculateDynamicMinIncrement(rivalCounterCents);
      setLots(prev => prev.map(l => {
        if (l.id !== lotId) return l;
        return {
          ...l,
          currentBidCents: rivalCounterCents,
          nextMinBidCents: nextReq,
          leadingBidderId: rival.bidderId,
          leadingPaddleNumber: rival.paddle,
          bidsCount: l.bidsCount + 2,
          endsAt: newEndsAt,
          extensionCount: softCloseExtended ? l.extensionCount + 1 : l.extensionCount,
        };
      }));

      // Trigger outbid shake and sound
      setLastOutbidLotId(lotId);
      setTimeout(() => setLastOutbidLotId(null), 1200);
      soundManager.playOutbidAlert();

      return {
        success: true,
        isLeading: false,
        wasOutbid: true,
        softCloseExtended,
        proxyDefended: false,
        message: `Rival ${rival.paddle} auto-defended with a higher proxy up to $${(rivalCounterCents / 100).toLocaleString()}`,
      };
    }

    // Challenger takes the lead!
    // Check if rival had a lower proxy that gets pushed up
    const incumbentBeaten = rival && rival.maxCents < bidAmountCents;
    if (incumbentBeaten) {
      // Deactivate defeated rival proxy
      setRivalProxyCeilings(prev => {
        const copy = { ...prev };
        delete copy[lotId];
        return copy;
      });
    }

    const newBidRecord: BidRecord = {
      id: `bid-${Date.now()}`,
      lotId,
      bidderId: currentUser.id,
      paddleNumber: currentUser.paddle.paddleNumber,
      amountCents: bidAmountCents,
      isProxyAutoBid: false,
      triggeredSoftCloseExtension: softCloseExtended,
      previousEndsAt: lot.endsAt,
      newEndsAt,
      createdAt: new Date().toISOString(),
      bidderTitle: `${currentUser.name} (Direct)`,
    };

    setBidsMap(prev => ({
      ...prev,
      [lotId]: [newBidRecord, ...(prev[lotId] || [])],
    }));

    // Calculate dynamic reserve status
    let updatedReserveStatus = lot.reserveStatus;
    if (lot.reservePriceCents && lot.reservePriceCents > 0) {
      if (bidAmountCents >= lot.reservePriceCents) {
        updatedReserveStatus = 'reserve_met';
      } else if (bidAmountCents >= Math.round(lot.reservePriceCents * 0.9)) {
        updatedReserveStatus = 'reserve_near';
      } else {
        updatedReserveStatus = 'not_met';
      }
    }

    const nextIncrement = calculateDynamicMinIncrement(bidAmountCents);
    const updatedNextMin = bidAmountCents + nextIncrement;

    setLots(prev => prev.map(l => {
      if (l.id !== lotId) return l;
      return {
        ...l,
        currentBidCents: bidAmountCents,
        nextMinBidCents: updatedNextMin,
        leadingBidderId: currentUser.id,
        leadingPaddleNumber: currentUser.paddle.paddleNumber,
        reserveStatus: updatedReserveStatus,
        bidsCount: l.bidsCount + 1,
        endsAt: newEndsAt,
        extensionCount: softCloseExtended ? l.extensionCount + 1 : l.extensionCount,
      };
    }));

    soundManager.playBidSuccessChime();

    return {
      success: true,
      isLeading: true,
      wasOutbid: false,
      softCloseExtended,
      proxyDefended: false,
      message: `You are now the leading bidder at $${(bidAmountCents / 100).toLocaleString()}!`,
    };
  }, [lots, currentUser, rivalProxyCeilings]);

  // Simulate a Rival Bid arriving over WebSocket
  const simulateRivalBid = useCallback((lotId: string) => {
    const lot = lots.find(l => l.id === lotId);
    if (!lot) return;

    const rivalPaddles = ['#8812', '#3301', '#7741', '#9104'];
    const randomPaddle = rivalPaddles[Math.floor(Math.random() * rivalPaddles.length)];
    const rivalBidCents = lot.nextMinBidCents;

    const nowMs = Date.now();
    const endsMs = new Date(lot.endsAt).getTime();
    const remainingMs = endsMs - nowMs;

    let softCloseExtended = false;
    let newEndsAt = lot.endsAt;

    if (remainingMs < 120000) {
      softCloseExtended = true;
      newEndsAt = new Date(nowMs + 120000).toISOString();
      setLastPopcornExtendedLotId(lotId);
      setTimeout(() => setLastPopcornExtendedLotId(null), 1500);
      soundManager.playPopcornResetChime();
    }

    // Check if the current user has an active proxy ceiling that defends against this rival!
    const userProxy = userProxyCeilings[lotId];
    if (userProxy && userProxy >= rivalBidCents) {
      // User's proxy ceiling defends automatically!
      const minInc = calculateDynamicMinIncrement(rivalBidCents);
      const userDefendCents = Math.min(userProxy, rivalBidCents + minInc);

      // Rival bid
      const rBid: BidRecord = {
        id: `bid-rival-${Date.now()}`,
        lotId,
        bidderId: `rival-${randomPaddle}`,
        paddleNumber: randomPaddle,
        amountCents: rivalBidCents,
        isProxyAutoBid: false,
        triggeredSoftCloseExtension: softCloseExtended,
        previousEndsAt: lot.endsAt,
        newEndsAt,
        createdAt: new Date().toISOString(),
        bidderTitle: `Challenger (${randomPaddle})`,
      };

      // User's autonomous defensive bid
      const uBid: BidRecord = {
        id: `bid-defend-${Date.now()}`,
        lotId,
        bidderId: currentUser.id,
        paddleNumber: currentUser.paddle.paddleNumber,
        amountCents: userDefendCents,
        isProxyAutoBid: true,
        triggeredSoftCloseExtension: false,
        previousEndsAt: lot.endsAt,
        newEndsAt,
        createdAt: new Date(Date.now() + 120).toISOString(),
        bidderTitle: `Proxy Shield (${currentUser.paddle.paddleNumber})`,
      };

      setBidsMap(prev => ({
        ...prev,
        [lotId]: [uBid, rBid, ...(prev[lotId] || [])],
      }));

      const nextReq = userDefendCents + calculateDynamicMinIncrement(userDefendCents);

      setLots(prev => prev.map(l => {
        if (l.id !== lotId) return l;
        return {
          ...l,
          currentBidCents: userDefendCents,
          nextMinBidCents: nextReq,
          leadingBidderId: currentUser.id,
          leadingPaddleNumber: currentUser.paddle.paddleNumber,
          bidsCount: l.bidsCount + 2,
          endsAt: newEndsAt,
          extensionCount: softCloseExtended ? l.extensionCount + 1 : l.extensionCount,
        };
      }));

      setLastProxyDefendedLotId(lotId);
      setTimeout(() => setLastProxyDefendedLotId(null), 1500);
      soundManager.playProxyDefendChime();
      return;
    }

    // User had no proxy or proxy was exceeded -> user is outbid!
    const rBid: BidRecord = {
      id: `bid-rival-${Date.now()}`,
      lotId,
      bidderId: `rival-${randomPaddle}`,
      paddleNumber: randomPaddle,
      amountCents: rivalBidCents,
      isProxyAutoBid: false,
      triggeredSoftCloseExtension: softCloseExtended,
      previousEndsAt: lot.endsAt,
      newEndsAt,
      createdAt: new Date().toISOString(),
      bidderTitle: `Challenger (${randomPaddle})`,
    };

    setBidsMap(prev => ({
      ...prev,
      [lotId]: [rBid, ...(prev[lotId] || [])],
    }));

    const nextReq = rivalBidCents + calculateDynamicMinIncrement(rivalBidCents);

    setLots(prev => prev.map(l => {
      if (l.id !== lotId) return l;
      return {
        ...l,
        currentBidCents: rivalBidCents,
        nextMinBidCents: nextReq,
        leadingBidderId: `rival-${randomPaddle}`,
        leadingPaddleNumber: randomPaddle,
        bidsCount: l.bidsCount + 1,
        endsAt: newEndsAt,
        extensionCount: softCloseExtended ? l.extensionCount + 1 : l.extensionCount,
      };
    }));

    setLastOutbidLotId(lotId);
    setTimeout(() => setLastOutbidLotId(null), 1200);
    soundManager.playOutbidAlert();
  }, [lots, userProxyCeilings, currentUser]);

  // Q&A / Timeline posting
  const postQuestion = useCallback((lotId: string, body: string) => {
    const newEntry: TimelineEntry = {
      id: `q-${Date.now()}`,
      lotId,
      authorId: currentUser.id,
      authorPaddleNumber: currentUser.paddle.paddleNumber,
      authorName: currentUser.name,
      authorRole: 'bidder',
      entryType: 'comment',
      body,
      isPinned: false,
      upvotesCount: 0,
      createdAt: new Date().toISOString(),
    };

    setTimelineMap(prev => ({
      ...prev,
      [lotId]: [newEntry, ...(prev[lotId] || [])],
    }));
  }, [currentUser]);

  const answerQuestion = useCallback((lotId: string, replyToId: string, body: string, pinToSpecs: boolean) => {
    const targetLot = lots.find(l => l.id === lotId);
    const sellerName = targetLot?.sellerName || 'Verified Consignor';

    const newEntry: TimelineEntry = {
      id: `ans-${Date.now()}`,
      lotId,
      authorId: targetLot?.sellerId || 'seller-1',
      authorName: `${sellerName} (Seller)`,
      authorRole: 'seller',
      entryType: 'seller_answer',
      replyToId,
      body,
      isPinned: pinToSpecs,
      upvotesCount: 1,
      createdAt: new Date().toISOString(),
    };

    setTimelineMap(prev => ({
      ...prev,
      [lotId]: [newEntry, ...(prev[lotId] || [])],
    }));
  }, [lots]);

  const upvoteTimelineEntry = useCallback((lotId: string, entryId: string) => {
    setTimelineMap(prev => {
      const list = prev[lotId] || [];
      return {
        ...prev,
        [lotId]: list.map(entry => {
          if (entry.id !== entryId) return entry;
          return {
            ...entry,
            upvotesCount: entry.upvotesCount + 1,
          };
        }),
      };
    });
  }, []);

  // Escrow / Settlements
  const updateSettlementStage = useCallback((settlementId: string, stage: EscrowStage) => {
    setSettlements(prev => prev.map(s => {
      if (s.id !== settlementId) return s;
      return {
        ...s,
        escrowStage: stage,
        settledAt: stage === 'payout_released' ? new Date().toISOString() : s.settledAt,
      };
    }));
  }, []);

  const updateCarrierTracking = useCallback((settlementId: string, carrier: string, trackingNumber: string) => {
    setSettlements(prev => prev.map(s => {
      if (s.id !== settlementId) return s;
      return {
        ...s,
        carrier,
        trackingNumber,
        escrowStage: 'in_transit_authenticated',
      };
    }));
  }, []);

  return (
    <AuctionContext.Provider
      value={{
        activeView,
        setActiveView,
        selectedLotId,
        setSelectedLotId,
        selectedLot,
        lots,
        bidsMap,
        timelineMap,
        settlements,
        currentUser,
        updatePaddle,
        isPaddleModalOpen,
        setIsPaddleModalOpen,
        isArchitectureModalOpen,
        setIsArchitectureModalOpen,
        userProxyCeilings,
        isSoundMuted,
        toggleSound,
        theme,
        toggleTheme,
        placeBid,
        simulateRivalBid,
        fastForwardClock,
        dropReserve,
        triggerHammerFall,
        postQuestion,
        answerQuestion,
        upvoteTimelineEntry,
        updateSettlementStage,
        updateCarrierTracking,
        lastOutbidLotId,
        lastPopcornExtendedLotId,
        lastProxyDefendedLotId,
      }}
    >
      {children}
    </AuctionContext.Provider>
  );
};

export function useAuction() {
  const ctx = useContext(AuctionContext);
  if (!ctx) {
    throw new Error('useAuction must be used within an AuctionProvider');
  }
  return ctx;
}
