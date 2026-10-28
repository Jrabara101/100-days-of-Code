import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  INITIAL_VENDORS,
  INITIAL_PRODUCTS,
  INITIAL_ORDERS,
  INITIAL_LEDGER_ENTRIES,
  INITIAL_COMMISSION_TIERS,
  INITIAL_COOP_CAMPAIGNS,
  CURATED_CROSS_SHOP_BUNDLE
} from '../data/mockData';

const MarketplaceContext = createContext(null);

export function MarketplaceProvider({ children }) {
  // Load state or use seeded initial data
  const [vendors, setVendors] = useState(() => {
    const saved = localStorage.getItem('mkt_vendors');
    return saved ? JSON.parse(saved) : INITIAL_VENDORS;
  });

  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('mkt_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('mkt_cart');
    if (saved) return JSON.parse(saved);
    // Pre-populate with items from 2 different vendors to immediately showcase unified multi-vendor grouping!
    return [
      {
        product_id: 'prod-koto-01',
        variant_id: 'var-koto-01a',
        vendor_id: 'ven-koto-01',
        title: 'Hasami Stoneware Pour-Over Dripper & Server',
        variant_title: '500ml / Natural Slate Glaze',
        price_cents: 6800, // $68.00 (Needs $7.00 more for $75.00 Free Shipping threshold!)
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&auto=format&fit=crop&q=80'
      },
      {
        product_id: 'prod-botanica-01',
        variant_id: 'var-bot-01a',
        vendor_id: 'ven-botanica-02',
        title: 'Sintra Pine Needle & Wild Bergamot Candle',
        variant_title: '280g / Amber Glass (65h Burn)',
        price_cents: 3800, // $38.00 (Needs $12.00 more for $50.00 Free Shipping threshold!)
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=300&auto=format&fit=crop&q=80'
      }
    ];
  });

  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('mkt_orders');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  const [ledgerEntries, setLedgerEntries] = useState(() => {
    const saved = localStorage.getItem('mkt_ledger');
    return saved ? JSON.parse(saved) : INITIAL_LEDGER_ENTRIES;
  });

  const [commissionTiers, setCommissionTiers] = useState(INITIAL_COMMISSION_TIERS);
  const [coopCampaigns, setCoopCampaigns] = useState(INITIAL_COOP_CAMPAIGNS);

  // Navigation & UI View State
  const [activeView, setActiveView] = useState('storefront'); // 'storefront' | 'product_detail' | 'vendor_boutique' | 'vendor_cockpit' | 'operator_hq' | 'order_tracker'
  const [selectedProductId, setSelectedProductId] = useState('prod-koto-01');
  const [selectedVendorSlug, setSelectedVendorSlug] = useState('atelier-koto');
  const [activeVendorId, setActiveVendorId] = useState('ven-koto-01'); // Vendor Cockpit persona

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isResolutionOpen, setIsResolutionOpen] = useState(false);
  const [selectedSubOrderForResolution, setSelectedSubOrderForResolution] = useState(null);

  const [activeReferralCode, setActiveReferralCode] = useState(null); // e.g. 'atelier-koto' -> 0% commission
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeOrderForTracking, setActiveOrderForTracking] = useState(null);

  // Notifications Toast
  const [toasts, setToasts] = useState([]);

  const addToast = (title, message, type = 'success') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('mkt_vendors', JSON.stringify(vendors));
  }, [vendors]);

  useEffect(() => {
    localStorage.setItem('mkt_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('mkt_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('mkt_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('mkt_ledger', JSON.stringify(ledgerEntries));
  }, [ledgerEntries]);

  // Check URL query parameters for referral on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const ref = urlParams.get('ref');
      if (ref) {
        setActiveReferralCode(ref);
        addToast(
          'Direct Maker Referral Link Active',
          `0% marketplace fee unlocked for ${ref.replace('-', ' ')}! Support makers directly.`,
          'info'
        );
      }
    }
  }, []);

  // Compute Cart grouped by Vendor with per-shop Free Shipping Progress
  const cartGroupedByVendor = useMemo(() => {
    const groups = {};

    cart.forEach((item) => {
      if (!groups[item.vendor_id]) {
        const vendor = vendors.find((v) => v.id === item.vendor_id) || {
          shop_name: 'Independent Maker',
          origin_city: 'Craft Studio',
          free_shipping_threshold_cents: 7500,
          flat_shipping_rate_cents: 800,
          avg_ship_hours: 24
        };

        groups[item.vendor_id] = {
          vendor_id: item.vendor_id,
          vendor,
          items: [],
          items_subtotal_cents: 0
        };
      }

      groups[item.vendor_id].items.push(item);
      groups[item.vendor_id].items_subtotal_cents += item.price_cents * item.quantity;
    });

    return Object.values(groups).map((group) => {
      const threshold = group.vendor.free_shipping_threshold_cents || 7500;
      const subtotal = group.items_subtotal_cents;
      const isFreeUnlocked = subtotal >= threshold;
      const remainingCents = Math.max(0, threshold - subtotal);
      const progressPct = Math.min(100, Math.round((subtotal / threshold) * 100));
      const shippingCents = isFreeUnlocked ? 0 : (group.vendor.flat_shipping_rate_cents || 800);

      // Candidate add-ons from this vendor (< $30 items)
      const vendorAddOns = products
        .filter((p) => p.vendor_id === group.vendor_id && p.variants.some((v) => v.price_cents <= 3000))
        .map((p) => {
          const cheapestVariant = p.variants.slice().sort((a, b) => a.price_cents - b.price_cents)[0];
          return {
            product: p,
            variant: cheapestVariant
          };
        })
        .filter(Boolean)
        .slice(0, 3);

      return {
        ...group,
        threshold_cents: threshold,
        is_free_unlocked: isFreeUnlocked,
        cents_to_free_shipping: remainingCents,
        progress_percentage: progressPct,
        shipping_cents: shippingCents,
        add_ons: vendorAddOns
      };
    });
  }, [cart, vendors, products]);

  // Overall Cart Financial Summary
  const cartSummary = useMemo(() => {
    const itemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);
    const distinctVendorsCount = cartGroupedByVendor.length;
    const itemsSubtotalCents = cartGroupedByVendor.reduce((acc, g) => acc + g.items_subtotal_cents, 0);
    const shippingTotalCents = cartGroupedByVendor.reduce((acc, g) => acc + g.shipping_cents, 0);
    const estimatedTaxCents = Math.round(itemsSubtotalCents * 0.08); // 8% tax
    const grandTotalCents = itemsSubtotalCents + shippingTotalCents + estimatedTaxCents;

    return {
      items_count: itemsCount,
      distinct_vendors_count: distinctVendorsCount,
      items_subtotal_cents: itemsSubtotalCents,
      shipping_total_cents: shippingTotalCents,
      tax_total_cents: estimatedTaxCents,
      grand_total_cents: grandTotalCents
    };
  }, [cart, cartGroupedByVendor]);

  // Add Item to Cart
  const addToCart = (product, variant, quantity = 1) => {
    // Check if vendor is in vacation mode
    const vendor = vendors.find((v) => v.id === product.vendor_id);
    if (vendor?.is_vacation_mode) {
      addToast(
        'Studio On Holiday',
        `${vendor.shop_name} is on holiday until ${vendor.vacation_return_date || 'next week'}. Pre-orders open soon!`,
        'alert'
      );
      return;
    }

    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.variant_id === variant.id);
      let updated;
      if (existingIndex > -1) {
        updated = [...prev];
        updated[existingIndex].quantity += quantity;
      } else {
        updated = [
          ...prev,
          {
            product_id: product.id,
            variant_id: variant.id,
            vendor_id: product.vendor_id,
            title: product.title,
            variant_title: variant.title,
            price_cents: variant.price_cents,
            quantity,
            image: product.images[0]
          }
        ];
      }

      // Check if this newly unlocked free shipping for this vendor
      const vendorItemsSubtotal = updated
        .filter((item) => item.vendor_id === product.vendor_id)
        .reduce((sum, item) => sum + item.price_cents * item.quantity, 0);

      const threshold = vendor?.free_shipping_threshold_cents || 7500;
      if (vendorItemsSubtotal >= threshold) {
        // Trigger celebratory confetti
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.8 },
            colors: ['#059669', '#10B981', '#34D399', '#C2410C']
          });
        } catch (e) {
          // ignore in SSR/test
        }
      }

      return updated;
    });

    addToast('Added to Unified Bag', `${quantity}x ${product.title} (${variant.title})`);
  };

  // Add Complete Cross-Shop Lookbook Bundle (1-click adds from 3 different independent shops!)
  const addCrossShopBundle = (bundle) => {
    bundle.items.forEach((item) => {
      const product = products.find((p) => p.id === item.product_id);
      const variant = product?.variants.find((v) => v.id === item.variant_id);
      if (product && variant) {
        // Apply 15% bundle discount
        const discountedPrice = Math.round(variant.price_cents * (1 - bundle.discount_pct / 100));
        setCart((prev) => {
          const idx = prev.findIndex((i) => i.variant_id === variant.id);
          if (idx > -1) {
            const next = [...prev];
            next[idx].quantity += 1;
            return next;
          }
          return [
            ...prev,
            {
              product_id: product.id,
              variant_id: variant.id,
              vendor_id: product.vendor_id,
              title: product.title,
              variant_title: `${variant.title} (Bundle ${bundle.discount_pct}% Off)`,
              price_cents: discountedPrice,
              quantity: 1,
              image: item.image
            }
          ];
        });
      }
    });

    try {
      confetti({
        particleCount: 80,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#C2410C', '#4F46E5', '#059669']
      });
    } catch (e) {}

    addToast(
      'Bundle Added to Bag!',
      `Added 3 items across ${bundle.items.length} independent studios with 15% co-op discount!`,
      'success'
    );
    setIsCartOpen(true);
  };

  const updateCartQuantity = (variant_id, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.variant_id === variant_id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (variant_id) => {
    setCart((prev) => prev.filter((item) => item.variant_id !== variant_id));
    addToast('Item Removed', 'Removed item from your unified bag.');
  };

  const clearCart = () => setCart([]);

  // Net-Margin Waterfall Calculator
  const calculatePricingWaterfall = (retailPriceCents, commissionBps = 1000, isDirect = false) => {
    const retail = Number(retailPriceCents) || 0;
    const effectiveBps = isDirect ? 0 : commissionBps;
    const commissionCents = Math.round((retail * effectiveBps) / 10000);
    // Stripe fee: 2.9% + $0.30
    const stripeGatewayCents = retail > 0 ? Math.round(retail * 0.029) + 30 : 0;
    const guaranteedNetCents = Math.max(0, retail - commissionCents - stripeGatewayCents);
    const takeRatePct = retail > 0 ? ((commissionCents / retail) * 100).toFixed(1) : '0.0';

    return {
      retail_cents: retail,
      commission_bps: effectiveBps,
      commission_cents: commissionCents,
      gateway_cents: stripeGatewayCents,
      guaranteed_net_cents: guaranteedNetCents,
      take_rate_pct: takeRatePct
    };
  };

  // Split Checkout Orchestrator (Atomic transaction simulation)
  const executeSplitCheckout = (buyerDetails) => {
    if (cart.length === 0) return null;

    const orderNumber = `MKT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const parentOrderId = `ord-${Date.now()}`;
    const nowIso = new Date().toISOString();

    const parentSubtotal = cartSummary.items_subtotal_cents;
    const parentShipping = cartSummary.shipping_total_cents;
    const parentTax = cartSummary.tax_total_cents;
    const parentGrandTotal = cartSummary.grand_total_cents;

    // Generate isolated sub-orders per vendor
    const newSubOrders = cartGroupedByVendor.map((group, index) => {
      const subOrderNumber = `${orderNumber}-V${index + 1}`;
      const subOrderId = `sub-${Date.now()}-${index + 1}`;
      const isDirectReferral = activeReferralCode === group.vendor.slug;
      const commissionBps = isDirectReferral ? 0 : (group.vendor.commission_rate_bps || 1000);

      const itemsCents = group.items_subtotal_cents;
      const shippingCents = group.shipping_cents;
      const commissionCents = Math.round((itemsCents * commissionBps) / 10000);
      const gatewayFeeCents = Math.round(itemsCents * 0.029) + 30;
      const netPayoutCents = itemsCents + shippingCents - commissionCents - gatewayFeeCents;

      return {
        id: subOrderId,
        sub_order_number: subOrderNumber,
        parent_order_id: parentOrderId,
        vendor_id: group.vendor_id,
        shop_name: group.vendor.shop_name,
        shop_origin: group.vendor.origin_city,
        fulfillment_status: 'confirmed', // Preparing at Studio
        referral_source: isDirectReferral ? 'vendor_direct' : 'marketplace',
        carrier_name: null,
        tracking_number: null,
        shipped_at: null,
        delivered_at: null,
        escrow_release_at: null,
        gross_items_cents: itemsCents,
        shipping_charged_cents: shippingCents,
        platform_commission_bps: commissionBps,
        platform_commission_cents: commissionCents,
        gateway_fee_allocation_cents: gatewayFeeCents,
        vendor_net_payout_cents: netPayoutCents,
        escrow_status: 'held_in_escrow',
        sla_hours_remaining: group.vendor.avg_ship_hours || 24,
        items: group.items.map((i) => ({
          title: i.title,
          variant: i.variant_title,
          quantity: i.quantity,
          unit_price_cents: i.price_cents,
          image: i.image
        }))
      };
    });

    const newParentOrder = {
      id: parentOrderId,
      order_number: orderNumber,
      buyer: {
        name: buyerDetails.name || 'Sofia Alcantara',
        email: buyerDetails.email || 'buyer@example.com',
        address: buyerDetails.address || '124 Craft Lane, Brooklyn, NY 11201'
      },
      currency: 'USD',
      created_at: nowIso,
      payment_status: 'paid',
      payment_intent_id: `pi_${Math.random().toString(36).substring(2, 12)}`,
      items_subtotal_cents: parentSubtotal,
      shipping_total_cents: parentShipping,
      tax_total_cents: parentTax,
      discount_total_cents: 0,
      grand_total_cents: parentGrandTotal,
      sub_orders: newSubOrders
    };

    // Update orders list
    setOrders((prev) => [newParentOrder, ...prev]);

    // Update vendors' escrow balances and create ledger entries
    newSubOrders.forEach((sub) => {
      setVendors((prev) =>
        prev.map((v) =>
          v.id === sub.vendor_id
            ? { ...v, escrow_balance_cents: v.escrow_balance_cents + sub.vendor_net_payout_cents }
            : v
        )
      );

      const newLedger = {
        id: `ledg-${Date.now()}-${sub.vendor_id}`,
        vendor_id: sub.vendor_id,
        sub_order_id: sub.id,
        type: 'sale_escrow_credit',
        amount_cents: sub.vendor_net_payout_cents,
        balance_bucket: 'escrow_pending',
        stripe_transfer_id: null,
        description: `Sale funds held in escrow for ${sub.sub_order_number} (Releases automatically upon carrier delivery scan)`,
        created_at: nowIso
      };

      setLedgerEntries((prev) => [newLedger, ...prev]);
    });

    // Clear cart and show confirmation
    clearCart();
    setIsCartOpen(false);
    setIsCheckoutOpen(false);
    setActiveOrderForTracking(newParentOrder);
    setActiveView('order_tracker');

    try {
      confetti({
        particleCount: 120,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#059669', '#C2410C', '#4F46E5', '#10B981']
      });
    } catch (e) {}

    addToast(
      'Checkout Succeeded!',
      `Order ${orderNumber} split into ${newSubOrders.length} independent vendor fulfillment queues.`,
      'success'
    );

    return newParentOrder;
  };

  // Vendor Action: Mark Sub-Order Shipped & Generate Label
  const markSubOrderShipped = (subOrderId, carrier = 'USPS Priority', trackingNum = null) => {
    const generatedTracking = trackingNum || `TRK-${carrier.substring(0, 3).toUpperCase()}-${Math.floor(10000000 + Math.random() * 90000000)}`;
    const nowIso = new Date().toISOString();

    setOrders((prev) =>
      prev.map((ord) => ({
        ...ord,
        sub_orders: ord.sub_orders.map((sub) => {
          if (sub.id === subOrderId) {
            return {
              ...sub,
              fulfillment_status: 'shipped',
              carrier_name: carrier,
              tracking_number: generatedTracking,
              shipped_at: nowIso,
              escrow_status: 'in_transit_escrow_held'
            };
          }
          return sub;
        })
      }))
    );

    addToast('Parcel Dispatched!', `Sub-Order marked shipped with ${carrier} (${generatedTracking})`);
  };

  // Carrier Webhook Simulation: Package Delivered -> Releases Escrow!
  const simulateCarrierDelivery = (subOrderId) => {
    let releasedPayout = 0;
    let targetVendorId = null;
    let targetSubOrderNum = '';

    setOrders((prev) =>
      prev.map((ord) => ({
        ...ord,
        sub_orders: ord.sub_orders.map((sub) => {
          if (sub.id === subOrderId) {
            releasedPayout = sub.vendor_net_payout_cents;
            targetVendorId = sub.vendor_id;
            targetSubOrderNum = sub.sub_order_number;

            return {
              ...sub,
              fulfillment_status: 'delivered',
              delivered_at: new Date().toISOString(),
              escrow_status: 'escrow_released'
            };
          }
          return sub;
        })
      }))
    );

    if (targetVendorId && releasedPayout > 0) {
      // Transfer balance from escrow bucket to available bucket
      setVendors((prev) =>
        prev.map((v) =>
          v.id === targetVendorId
            ? {
                ...v,
                escrow_balance_cents: Math.max(0, v.escrow_balance_cents - releasedPayout),
                available_balance_cents: v.available_balance_cents + releasedPayout
              }
            : v
        )
      );

      // Add double entry ledger record
      const ledgerRecord = {
        id: `ledg-rel-${Date.now()}`,
        vendor_id: targetVendorId,
        sub_order_id: subOrderId,
        type: 'escrow_released',
        amount_cents: releasedPayout,
        balance_bucket: 'available',
        stripe_transfer_id: `tr_${Math.random().toString(36).substring(2, 10)}`,
        description: `Carrier delivery verified. Escrow auto-released for ${targetSubOrderNum}. Funds available for bank withdrawal.`,
        created_at: new Date().toISOString()
      };

      setLedgerEntries((prev) => [ledgerRecord, ...prev]);

      try {
        confetti({
          particleCount: 70,
          spread: 70,
          origin: { y: 0.7 },
          colors: ['#059669', '#10B981', '#34D399']
        });
      } catch (e) {}

      addToast(
        'Delivery Confirmed & Escrow Released!',
        `$${(releasedPayout / 100).toFixed(2)} moved to Available Balance for payout!`,
        'success'
      );
    }
  };

  // Vendor Action: 1-Click Withdraw to Bank
  const withdrawVendorFunds = (vendorId, amountCents = null) => {
    const vendor = vendors.find((v) => v.id === vendorId);
    if (!vendor || vendor.available_balance_cents <= 0) {
      addToast('No Available Funds', 'No funds available to withdraw at this time.', 'alert');
      return;
    }

    const withdrawAmount = amountCents || vendor.available_balance_cents;

    setVendors((prev) =>
      prev.map((v) =>
        v.id === vendorId
          ? { ...v, available_balance_cents: Math.max(0, v.available_balance_cents - withdrawAmount) }
          : v
      )
    );

    const ledgerRecord = {
      id: `ledg-wd-${Date.now()}`,
      vendor_id: vendorId,
      sub_order_id: null,
      type: 'payout_withdrawal',
      amount_cents: -withdrawAmount,
      balance_bucket: 'available',
      stripe_transfer_id: `po_${Math.random().toString(36).substring(2, 12)}`,
      description: `Stripe Connect payout sweep to linked bank account (•••• 4910)`,
      created_at: new Date().toISOString()
    };

    setLedgerEntries((prev) => [ledgerRecord, ...prev]);
    addToast(
      'Payout Initiated!',
      `$${(withdrawAmount / 100).toFixed(2)} is on its way to your linked bank account via Stripe Connect.`,
      'success'
    );
  };

  // Toggle Vacation Mode
  const toggleVacationMode = (vendorId) => {
    setVendors((prev) =>
      prev.map((v) => {
        if (v.id === vendorId) {
          const next = !v.is_vacation_mode;
          addToast(
            next ? 'Vacation Mode Activated' : 'Storefront Live Again',
            next
              ? `${v.shop_name} is now on holiday mode with restock waitlists.`
              : `${v.shop_name} is open for instant order fulfillment!`,
            next ? 'info' : 'success'
          );
          return { ...v, is_vacation_mode: next };
        }
        return v;
      })
    );
  };

  // Zero-Hostility Partial Refund or Return Resolution
  const resolveTicket = (subOrderId, type, refundAmountCents = 2500, reason = '') => {
    setOrders((prev) =>
      prev.map((ord) => ({
        ...ord,
        sub_orders: ord.sub_orders.map((sub) => {
          if (sub.id === subOrderId) {
            return {
              ...sub,
              fulfillment_status: type === 'partial_refund' ? 'partially_refunded' : 'returned',
              resolution_note: `${type === 'partial_refund' ? 'Partial Keep-Item Refund' : 'Prepaid Return'}: $${(refundAmountCents / 100).toFixed(2)} - ${reason}`
            };
          }
          return sub;
        })
      }))
    );

    // If partial refund, add refund ledger debit
    if (selectedSubOrderForResolution) {
      const vendorId = selectedSubOrderForResolution.vendor_id;
      setLedgerEntries((prev) => [
        {
          id: `ledg-ref-${Date.now()}`,
          vendor_id: vendorId,
          sub_order_id: subOrderId,
          type: 'refund_debit',
          amount_cents: -refundAmountCents,
          balance_bucket: 'escrow_pending',
          stripe_transfer_id: null,
          description: `Zero-hostility partial refund issued ($${(refundAmountCents / 100).toFixed(2)}) for buyer satisfaction.`,
          created_at: new Date().toISOString()
        },
        ...prev
      ]);
    }

    setIsResolutionOpen(false);
    addToast(
      'Resolution Processed!',
      type === 'partial_refund'
        ? `$${(refundAmountCents / 100).toFixed(2)} refunded instantly to buyer's card. Buyer keeps item.`
        : 'Prepaid prepaid return label sent to buyer.'
    );
  };

  return (
    <MarketplaceContext.Provider
      value={{
        vendors,
        setVendors,
        products,
        setProducts,
        cart,
        cartGroupedByVendor,
        cartSummary,
        orders,
        ledgerEntries,
        commissionTiers,
        setCommissionTiers,
        coopCampaigns,
        setCoopCampaigns,
        activeView,
        setActiveView,
        selectedProductId,
        setSelectedProductId,
        selectedVendorSlug,
        setSelectedVendorSlug,
        activeVendorId,
        setActiveVendorId,
        isCartOpen,
        setIsCartOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
        isResolutionOpen,
        setIsResolutionOpen,
        selectedSubOrderForResolution,
        setSelectedSubOrderForResolution,
        activeReferralCode,
        setActiveReferralCode,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        activeOrderForTracking,
        setActiveOrderForTracking,
        toasts,
        addToast,
        addToCart,
        addCrossShopBundle,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        calculatePricingWaterfall,
        executeSplitCheckout,
        markSubOrderShipped,
        simulateCarrierDelivery,
        withdrawVendorFunds,
        toggleVacationMode,
        resolveTicket,
        curatedBundle: CURATED_CROSS_SHOP_BUNDLE
      }}
    >
      {children}
    </MarketplaceContext.Provider>
  );
}

export function useMarketplace() {
  const context = useContext(MarketplaceContext);
  if (!context) {
    throw new Error('useMarketplace must be used within a MarketplaceProvider');
  }
  return context;
}
