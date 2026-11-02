import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { INITIAL_PRODUCTS, INITIAL_REVIEWS, INITIAL_ANOMALY_SIGNALS } from '../lib/initialData';
import { calculateBayesianScore, evaluateReviewRisk, sanitizeReviewText, scanTextEntities } from '../lib/trustEngine';

const TrustStoreContext = createContext(null);

const STORAGE_KEY_PRODUCTS = 'hollis_trust_products_v1';
const STORAGE_KEY_REVIEWS = 'hollis_trust_reviews_v1';
const STORAGE_KEY_AUDIT = 'hollis_trust_audit_v1';

export function TrustStoreProvider({ children }) {
  // Load products with localStorage cache fallback
  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PRODUCTS);
      return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  // Load reviews
  const [reviews, setReviews] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_REVIEWS);
      return saved ? JSON.parse(saved) : INITIAL_REVIEWS;
    } catch {
      return INITIAL_REVIEWS;
    }
  });

  // Audit logs
  const [auditLogs, setAuditLogs] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_AUDIT);
      return saved ? JSON.parse(saved) : [
        {
          id: 'log_init',
          action: 'SYSTEM_BOOT',
          actor: 'Hollis Trust Kernel v4.2',
          timestamp: new Date().toISOString(),
          diff: 'Initial verified ledger synchronized'
        }
      ];
    } catch {
      return [];
    }
  });

  // Active product on storefront
  const [activeProductId, setActiveProductId] = useState('prod_kettle_mbk');

  // Active review selected in Admin Triage Queue
  const [selectedReviewId, setSelectedReviewId] = useState('REV-094182');

  // Active moderation queue tab in Admin Sidebar
  const [activeQueueTab, setActiveQueueTab] = useState('triage-inbox'); // 'triage-inbox' | 'needs-redaction' | 'media-blur' | 'low-star-escalations' | 'fraud-hold' | 'published'

  // Application View Mode
  const [viewMode, setViewMode] = useState('storefront'); // 'storefront' | 'admin'

  // Search filter inside admin queue
  const [adminSearchQuery, setAdminSearchQuery] = useState('');

  // Persist state updates to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(reviews));
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }, [reviews]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(auditLogs));
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }, [auditLogs]);

  // Active product object
  const activeProduct = useMemo(() => {
    return products.find(p => p.id === activeProductId) || products[0];
  }, [products, activeProductId]);

  // Selected review in admin
  const selectedReview = useMemo(() => {
    return reviews.find(r => r.id === selectedReviewId) || reviews[0];
  }, [reviews, selectedReviewId]);

  // Recalculate aggregates for a product
  const recalculateProductAggregates = (productId, customReviewsList = null) => {
    const list = customReviewsList || reviews;
    const prodReviews = list.filter(r => r.productId === productId && r.moderationStatus === 'approved');

    setProducts(prevProducts => {
      return prevProducts.map(prod => {
        if (prod.id !== productId) return prod;

        const total = prodReviews.length;
        if (total === 0) return prod;

        const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        let sumRating = 0;
        let verifiedCount = 0;

        prodReviews.forEach(r => {
          distribution[r.rating] = (distribution[r.rating] || 0) + 1;
          sumRating += r.rating;
          if (r.provenanceType === 'verified_purchase' || r.provenanceType === 'repeat_buyer') {
            verifiedCount++;
          }
        });

        const avgRating = Number((sumRating / total).toFixed(2));
        const bayesian = calculateBayesianScore(avgRating, total);
        const recommendPercent = Math.round(((distribution[5] + distribution[4]) / total) * 100);

        return {
          ...prod,
          totalReviews: total,
          verifiedReviews: verifiedCount,
          rating: avgRating,
          bayesianScore: bayesian,
          recommendPercent,
          ratingDistribution: distribution
        };
      });
    });
  };

  // Add a newly submitted review from customer storefront
  const submitReview = ({
    productId,
    rating,
    title,
    body,
    variantTitle,
    reviewerName,
    reviewerLocation,
    reviewerAttributes = {},
    mediaFiles = []
  }) => {
    const newId = `REV-${Math.floor(100000 + Math.random() * 900000)}`;
    const product = products.find(p => p.id === productId);

    // Run automated risk & PII linter
    const riskAnalysis = evaluateReviewRisk({
      rating,
      title,
      body,
      provenanceType: 'verified_purchase',
      accountAgeDays: 14
    });

    const sanitizedBody = sanitizeReviewText(body);
    const hasPiiOrClaims = riskAnalysis.entities.length > 0;
    const hasMedia = mediaFiles.length > 0;

    // Automatic approval threshold: verified purchase, rating >= 3, risk < 15, no PII
    const autoApprove = !hasPiiOrClaims && !hasMedia && rating >= 3 && riskAnalysis.riskScore < 15;

    let queue = 'published';
    let status = 'approved';

    if (!autoApprove) {
      status = 'pending';
      if (hasPiiOrClaims) {
        queue = 'needs-redaction';
      } else if (hasMedia) {
        queue = 'media-blur';
      } else if (rating <= 2) {
        queue = 'low-star-escalations';
      } else {
        queue = 'triage-inbox';
      }
    }

    const newReview = {
      id: newId,
      productId,
      productTitle: product ? product.title : 'Pour-Over Kettle · Matte Black',
      productSku: product ? product.sku : 'FLW-STAGG-MBK',
      variantTitle: variantTitle || 'Matte Black · 1 L',
      orderId: `HG-${Math.floor(1000 + Math.random() * 9000)}`,
      reviewerName: reviewerName || 'Verified Buyer',
      reviewerLocation: reviewerLocation || 'United States',
      reviewerAttributes,
      rating,
      title,
      bodyOriginal: body,
      bodySanitized: sanitizedBody,
      isRedacted: false,
      provenanceType: 'verified_purchase',
      tokenNumber: `US-${Math.floor(1000 + Math.random() * 9000)}-K`,
      purchasedDate: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      moderationStatus: status,
      priorityQueue: queue,
      slaRemainingMinutes: 45,
      riskScore: riskAnalysis.riskScore,
      riskLevel: riskAnalysis.riskLevel,
      riskFlags: riskAnalysis.flags,
      media: mediaFiles.map((m, idx) => ({
        id: `media_${newId}_${idx}`,
        type: 'image',
        sanitizedUrl: m.previewUrl || m.url,
        filename: m.sanitizedName || m.name || 'unboxing.webp',
        dimensions: `${m.width || 1920} × ${m.height || 1440}`,
        fileSize: m.fileSize || '340 KB',
        exifStripped: true,
        perceptualHash: m.perceptualHash || 'phash_auto',
        isBlurred: false
      })),
      helpfulVotes: 0,
      unhelpfulVotes: 0,
      auditLog: [
        { action: 'SUBMISSION_RECORDED', actor: 'STOREFRONT_COMPOSER', timestamp: new Date().toISOString() },
        { action: autoApprove ? 'AUTO_APPROVED' : 'ROUTED_TO_TRIAGE', queue, riskScore: riskAnalysis.riskScore, actor: 'TRUST_ROUTER', timestamp: new Date().toISOString() }
      ],
      followUpUpdate: null
    };

    const updatedReviews = [newReview, ...reviews];
    setReviews(updatedReviews);

    // If auto approved, recalculate aggregates
    if (autoApprove) {
      recalculateProductAggregates(productId, updatedReviews);
    }

    // Add to audit
    setAuditLogs(prev => [
      {
        id: `log_${Date.now()}`,
        action: autoApprove ? 'AUTO_APPROVED' : 'NEW_TRIAGE_ITEM',
        actor: autoApprove ? 'KERNEL_RULE_VERIFIED' : 'CUSTOMER_INGEST',
        timestamp: new Date().toISOString(),
        diff: `Review ${newId} (${rating}★) created with risk score ${riskAnalysis.riskScore}`
      },
      ...prev
    ]);

    return newReview;
  };

  // Add 6-Month Ownership Update
  const addOwnershipUpdate = (reviewId, updateText) => {
    setReviews(prev =>
      prev.map(r => {
        if (r.id !== reviewId) return r;
        return {
          ...r,
          followUpUpdate: {
            timestamp: new Date().toISOString(),
            label: '⏱ 6-Month Ownership Update',
            text: updateText
          }
        };
      })
    );

    setAuditLogs(prev => [
      {
        id: `log_${Date.now()}`,
        action: 'LONGITUDINAL_UPDATE_APPENDED',
        actor: 'VERIFIED_BUYER_LINK',
        timestamp: new Date().toISOString(),
        diff: `Ownership update added to ${reviewId}`
      },
      ...prev
    ]);
  };

  // Upvote / Helpful action
  const voteHelpful = (reviewId) => {
    setReviews(prev =>
      prev.map(r => {
        if (r.id !== reviewId) return r;
        return { ...r, helpfulVotes: (r.helpfulVotes || 0) + 1 };
      })
    );
  };

  // Admin: Approve review as is
  const approveReview = (reviewId) => {
    setReviews(prev => {
      const next = prev.map(r => {
        if (r.id !== reviewId) return r;
        return {
          ...r,
          moderationStatus: 'approved',
          priorityQueue: 'published',
          auditLog: [
            ...(r.auditLog || []),
            { action: 'APPROVED', actor: 'LEAD_OPERATOR (op_mc)', timestamp: new Date().toISOString() }
          ]
        };
      });

      const target = next.find(r => r.id === reviewId);
      if (target) {
        recalculateProductAggregates(target.productId, next);
      }
      return next;
    });

    setAuditLogs(prev => [
      {
        id: `log_${Date.now()}`,
        action: 'REVIEW_APPROVED',
        actor: 'LEAD_OPERATOR (op_mc)',
        timestamp: new Date().toISOString(),
        diff: `Approved ${reviewId} directly to published storefront`
      },
      ...prev
    ]);
  };

  // Admin: Redact entities & approve
  const redactAndApproveReview = (reviewId) => {
    setReviews(prev => {
      const next = prev.map(r => {
        if (r.id !== reviewId) return r;
        const sanitized = sanitizeReviewText(r.bodyOriginal);
        return {
          ...r,
          bodySanitized: sanitized,
          isRedacted: true,
          moderationStatus: 'approved',
          priorityQueue: 'published',
          riskFlags: r.riskFlags.filter(f => !f.includes('pii') && !f.includes('claim')),
          auditLog: [
            ...(r.auditLog || []),
            { action: 'MASK_AND_APPROVE', actor: 'LEAD_OPERATOR (op_mc)', timestamp: new Date().toISOString(), note: 'Sanitized sensitive tokens' }
          ]
        };
      });

      const target = next.find(r => r.id === reviewId);
      if (target) {
        recalculateProductAggregates(target.productId, next);
      }
      return next;
    });

    setAuditLogs(prev => [
      {
        id: `log_${Date.now()}`,
        action: 'REDACT_AND_APPROVE',
        actor: 'LEAD_OPERATOR (op_mc)',
        timestamp: new Date().toISOString(),
        diff: `Masked PII/claims and approved ${reviewId}`
      },
      ...prev
    ]);
  };

  // Admin: Reject review
  const rejectReview = (reviewId, reason = 'Policy Violation (Spam / Inappropriate Content)') => {
    setReviews(prev =>
      prev.map(r => {
        if (r.id !== reviewId) return r;
        return {
          ...r,
          moderationStatus: 'rejected',
          priorityQueue: 'fraud-hold',
          rejectionReason: reason,
          auditLog: [
            ...(r.auditLog || []),
            { action: 'REJECTED', actor: 'LEAD_OPERATOR (op_mc)', reason, timestamp: new Date().toISOString() }
          ]
        };
      })
    );

    setAuditLogs(prev => [
      {
        id: `log_${Date.now()}`,
        action: 'REVIEW_REJECTED',
        actor: 'LEAD_OPERATOR (op_mc)',
        timestamp: new Date().toISOString(),
        diff: `Rejected ${reviewId} — Reason: ${reason}`
      },
      ...prev
    ]);
  };

  // Admin: Blur media
  const blurMediaItem = (reviewId, mediaId, blurredDataUrl = null) => {
    setReviews(prev =>
      prev.map(r => {
        if (r.id !== reviewId) return r;
        return {
          ...r,
          media: (r.media || []).map(m => {
            if (m.id !== mediaId) return m;
            return {
              ...m,
              isBlurred: true,
              sanitizedUrl: blurredDataUrl || m.sanitizedUrl,
              hasBBoxExposure: false
            };
          }),
          auditLog: [
            ...(r.auditLog || []),
            { action: 'MEDIA_BLURRED', actor: 'LEAD_OPERATOR (op_mc)', timestamp: new Date().toISOString(), note: 'Applied privacy Gaussian blur box over label' }
          ]
        };
      })
    );

    setAuditLogs(prev => [
      {
        id: `log_${Date.now()}`,
        action: 'MEDIA_BLUR_COMMITTED',
        actor: 'LEAD_OPERATOR (op_mc)',
        timestamp: new Date().toISOString(),
        diff: `Blurred sensitive label region in media for review ${reviewId}`
      },
      ...prev
    ]);
  };

  // Admin: Post Brand Response & Make-Good
  const postBrandResponse = (reviewId, { responderName, responderTitle, body, makeGood = null }) => {
    setReviews(prev =>
      prev.map(r => {
        if (r.id !== reviewId) return r;
        return {
          ...r,
          brandResponse: {
            responderName: responderName || 'Ana Ruiz',
            responderTitle: responderTitle || 'Head of Product Quality',
            body,
            createdAt: new Date().toISOString(),
            isPublic: true,
            makeGood
          },
          auditLog: [
            ...(r.auditLog || []),
            { action: 'BRAND_RESPONSE_POSTED', actor: `${responderName} (${responderTitle})`, timestamp: new Date().toISOString() }
          ]
        };
      })
    );

    setAuditLogs(prev => [
      {
        id: `log_${Date.now()}`,
        action: 'BRAND_RESPONSE_POSTED',
        actor: `${responderName} (${responderTitle})`,
        timestamp: new Date().toISOString(),
        diff: `Posted official brand response to review ${reviewId}`
      },
      ...prev
    ]);
  };

  // Toggle Review-Bomb Verified-Purchase Lockdown
  const toggleVerifiedLockdown = (productId) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.id !== productId) return p;
        const newLockState = !p.isBrigadeLocked;
        return {
          ...p,
          isBrigadeLocked: newLockState
        };
      })
    );

    setAuditLogs(prev => [
      {
        id: `log_${Date.now()}`,
        action: 'CIRCUIT_BREAKER_TOGGLED',
        actor: 'LEAD_OPERATOR (op_mc)',
        timestamp: new Date().toISOString(),
        diff: `Verified-Purchase Lockdown toggled for ${productId}`
      },
      ...prev
    ]);
  };

  // Reset to initial factory defaults
  const resetToFactoryDefaults = () => {
    localStorage.removeItem(STORAGE_KEY_PRODUCTS);
    localStorage.removeItem(STORAGE_KEY_REVIEWS);
    localStorage.removeItem(STORAGE_KEY_AUDIT);
    setProducts(INITIAL_PRODUCTS);
    setReviews(INITIAL_REVIEWS);
    setActiveProductId('prod_kettle_mbk');
    setSelectedReviewId('REV-094182');
    setActiveQueueTab('triage-inbox');
    setAuditLogs([
      {
        id: 'log_reset',
        action: 'FACTORY_RESET',
        actor: 'OPERATOR',
        timestamp: new Date().toISOString(),
        diff: 'Database restored to pristine initial seed'
      }
    ]);
  };

  // Telemetry counts
  const telemetryStats = useMemo(() => {
    const pendingReviews = reviews.filter(r => r.moderationStatus === 'pending');
    const autoApprovedCount = reviews.filter(r => r.moderationStatus === 'approved' && !r.isRedacted).length;
    const totalCount = reviews.length;
    const autoPercent = totalCount > 0 ? Math.round((autoApprovedCount / totalCount) * 100) : 91;

    return {
      pendingCount: pendingReviews.length,
      autoApprovedPercent: autoPercent || 91,
      avgTriageSeconds: 4.2,
      brigadeShieldStatus: products.some(p => p.isBrigadeLocked) ? 'Lockdown Active' : 'Normal',
      hasActiveLockdown: products.some(p => p.isBrigadeLocked)
    };
  }, [reviews, products]);

  // Queue counts for sidebar
  const queueCounts = useMemo(() => {
    return {
      'triage-inbox': reviews.filter(r => r.moderationStatus === 'pending').length,
      'needs-redaction': reviews.filter(r => r.priorityQueue === 'needs-redaction' && r.moderationStatus === 'pending').length,
      'media-blur': reviews.filter(r => r.priorityQueue === 'media-blur' && r.moderationStatus === 'pending').length,
      'low-star-escalations': reviews.filter(r => r.priorityQueue === 'low-star-escalations' && r.moderationStatus === 'pending').length,
      'fraud-hold': reviews.filter(r => r.priorityQueue === 'fraud-hold' || r.moderationStatus === 'rejected').length,
      'published': reviews.filter(r => r.moderationStatus === 'approved').length
    };
  }, [reviews]);

  const value = {
    products,
    reviews,
    auditLogs,
    activeProductId,
    setActiveProductId,
    activeProduct,
    selectedReviewId,
    setSelectedReviewId,
    selectedReview,
    activeQueueTab,
    setActiveQueueTab,
    viewMode,
    setViewMode,
    adminSearchQuery,
    setAdminSearchQuery,
    telemetryStats,
    queueCounts,
    submitReview,
    addOwnershipUpdate,
    voteHelpful,
    approveReview,
    redactAndApproveReview,
    rejectReview,
    blurMediaItem,
    postBrandResponse,
    toggleVerifiedLockdown,
    recalculateProductAggregates,
    resetToFactoryDefaults
  };

  return (
    <TrustStoreContext.Provider value={value}>
      {children}
    </TrustStoreContext.Provider>
  );
}

export function useTrustStore() {
  const context = useContext(TrustStoreContext);
  if (!context) {
    throw new Error('useTrustStore must be used within a TrustStoreProvider');
  }
  return context;
}

