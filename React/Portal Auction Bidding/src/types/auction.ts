export type LotStatus = 
  | 'scheduled' 
  | 'live' 
  | 'sold_hammer' 
  | 'unsold_reserve_not_met' 
  | 'settled';

export type ReserveStatus = 
  | 'no_reserve' 
  | 'not_met' 
  | 'reserve_near' 
  | 'reserve_met';

export type AuthorRole = 
  | 'bidder' 
  | 'seller' 
  | 'specialist' 
  | 'system';

export type TimelineEntryType = 
  | 'comment' 
  | 'seller_answer' 
  | 'inspection_addendum' 
  | 'reserve_lowered_event'
  | 'system_milestone';

export type EscrowStage = 
  | 'awaiting_payment' 
  | 'funds_in_escrow' 
  | 'in_transit_authenticated' 
  | 'buyer_inspected' 
  | 'payout_released' 
  | 'disputed';

export interface ConditionPin {
  id: string;
  xPercent: number; // 0 to 100 on the image
  yPercent: number; // 0 to 100 on the image
  label: string;
  category: 'blemish' | 'restoration' | 'serial' | 'patina' | 'mint_detail';
  description: string;
  inspectorNote?: string;
  zoomImage?: string;
}

export interface MediaItem {
  id: string;
  url: string;
  thumbnailUrl: string;
  category: 'exterior' | 'interior' | 'movement' | 'provenance' | 'imperfections';
  caption: string;
  hasConditionPins?: boolean;
}

export interface BidRecord {
  id: string;
  lotId: string;
  bidderId: string;
  paddleNumber: string;
  amountCents: number;
  isProxyAutoBid: boolean;
  triggeredSoftCloseExtension: boolean;
  previousEndsAt: string;
  newEndsAt: string;
  createdAt: string;
  bidderTitle?: string;
}

export interface TimelineEntry {
  id: string;
  lotId: string;
  authorId: string;
  authorPaddleNumber?: string;
  authorName: string;
  authorRole: AuthorRole;
  entryType: TimelineEntryType;
  body: string;
  mediaUrls?: string[];
  isPinned: boolean;
  upvotesCount: number;
  createdAt: string;
  replyToId?: string;
}

export interface LotItem {
  id: string;
  lotNumber: string; // e.g. 'LOT-2026-041'
  title: string;
  subtitle: string;
  slug: string;
  category: 'Automotive' | 'Haute Horlogerie' | 'Fine Instruments' | 'Rare Collectibles';
  conditionGrade: string; // e.g. '9.4/10 Mint'
  provenanceSummary: string;
  location: string;
  sellerId: string;
  sellerName: string;
  sellerIsVerified: boolean;
  
  // Media & Condition
  mediaGallery: MediaItem[];
  conditionPins: ConditionPin[];
  specifications: Record<string, string>;
  
  // Financial & Bidding
  startingBidCents: number;
  reservePriceCents?: number; // confidential on server; simulated in demo
  reserveStatus: ReserveStatus;
  currentBidCents: number;
  nextMinBidCents: number;
  leadingBidderId?: string;
  leadingPaddleNumber?: string;
  bidsCount: number;
  watchersCount: number;
  extensionCount: number;
  status: LotStatus;
  
  // Timing
  startsAt: string; // ISO
  endsAt: string; // ISO
  closedAt?: string;
  
  // Dynamic user specific (derived)
  isWatchedByCurrentUser?: boolean;
}

export interface BidderPaddle {
  id: string;
  userId: string;
  paddleNumber: string; // e.g. '#4092'
  heldDepositCents: number; // e.g. $1,000.00
  biddingLimitCents: number; // e.g. $50,000.00
  holdStatus: 'active_authorized' | 'captured_default' | 'released';
  isVerified: boolean;
  userName: string;
  email: string;
  cardLast4: string;
  verifiedAt: string;
}

export interface ProxyMaxBid {
  lotId: string;
  bidderId: string;
  paddleNumber: string;
  maxCeilingCents: number;
  isActive: boolean;
}

export interface HammerSettlement {
  id: string;
  settlementNumber: string; // 'STL-2026-881'
  lotId: string;
  lotTitle: string;
  winnerId: string;
  winnerPaddleNumber: string;
  sellerId: string;
  sellerName: string;
  hammerPriceCents: number;
  buyerPremiumCents: number;
  shippingInsuredCents: number;
  depositAppliedCents: number;
  totalBuyerDueCents: number;
  sellerCommissionCents: number;
  sellerNetPayoutCents: number;
  escrowStage: EscrowStage;
  trackingNumber?: string;
  carrier?: string;
  payoutTraceId?: string;
  createdAt: string;
  settledAt?: string;
}

// Dynamic Bid Increment Ladder rules
export function calculateDynamicMinIncrement(currentBidCents: number): number {
  if (currentBidCents < 100000) {
    // Under $1,000 -> +$50
    return 5000;
  } else if (currentBidCents < 1000000) {
    // $1,000 to $10,000 -> +$250
    return 25000;
  } else if (currentBidCents < 2500000) {
    // $10,000 to $25,000 -> +$500
    return 50000;
  } else {
    // Above $25,000 -> +$1,000
    return 100000;
  }
}

// Buyer's Premium (default 500 basis points = 5.0%)
export const BUYER_PREMIUM_BPS = 500;

export function calculateBuyerPremium(bidAmountCents: number): number {
  return Math.round((bidAmountCents * BUYER_PREMIUM_BPS) / 10000);
}

// Estimated Insured Transit calculation
export function calculateEstimatedShipping(bidAmountCents: number, category: string): number {
  if (category === 'Automotive') {
    // Enclosed carrier transport estimate
    return 145000; // $1,450.00
  } else if (category === 'Haute Horlogerie') {
    // Armored courier with high-value insurance
    return 18500; // $185.00
  } else if (category === 'Fine Instruments') {
    // Climate-controlled insured instrument courier
    return 32000; // $320.00
  }
  return 12500; // $125.00
}

export interface LandedCostBreakdown {
  bidAmountCents: number;
  buyerPremiumCents: number;
  estimatedShippingCents: number;
  depositHoldCents: number;
  totalLandedCommitmentCents: number;
}

export function calculateLandedCost(
  bidAmountCents: number, 
  category: string, 
  paddleDepositCents = 100000
): LandedCostBreakdown {
  const buyerPremiumCents = calculateBuyerPremium(bidAmountCents);
  const estimatedShippingCents = calculateEstimatedShipping(bidAmountCents, category);
  const totalLandedCommitmentCents = bidAmountCents + buyerPremiumCents + estimatedShippingCents;

  return {
    bidAmountCents,
    buyerPremiumCents,
    estimatedShippingCents,
    depositHoldCents: paddleDepositCents,
    totalLandedCommitmentCents
  };
}

