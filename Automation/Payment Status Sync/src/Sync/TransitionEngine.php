<?php

namespace App\PaymentSync\Sync;

use App\PaymentSync\Model\PaymentStatus;

class TransitionEngine
{
    /**
     * Evaluate the safety of transitioning from a local payment status to a remote status.
     *
     * @param string $localStatus
     * @param string $remoteStatus
     * @return TransitionResult
     */
    public function evaluate(string $localStatus, string $remoteStatus): TransitionResult
    {
        if ($localStatus === $remoteStatus) {
            return new TransitionResult(
                TransitionResult::TYPE_NO_CHANGE,
                "Statuses are identical. No update required."
            );
        }

        switch ($localStatus) {
            case PaymentStatus::PENDING:
                // From pending, any update (AUTHORIZED, PAID, FAILED, EXPIRED, REFUNDED) is a safe forward step
                return new TransitionResult(
                    TransitionResult::TYPE_SAFE_UPDATE,
                    "Safe forward update from PENDING to {$remoteStatus}."
                );

            case PaymentStatus::AUTHORIZED:
                if (in_array($remoteStatus, [PaymentStatus::PAID, PaymentStatus::FAILED, PaymentStatus::EXPIRED, PaymentStatus::REFUNDED], true)) {
                    return new TransitionResult(
                        TransitionResult::TYPE_SAFE_UPDATE,
                        "Safe capture or expiration update: AUTHORIZED -> {$remoteStatus}."
                    );
                }
                
                // authorized -> pending is a regression
                return new TransitionResult(
                    TransitionResult::TYPE_CONFLICT_REVIEW,
                    "Suspicious state regression: local is AUTHORIZED, remote is {$remoteStatus}."
                );

            case PaymentStatus::PAID:
                // paid -> refunded is acceptable (e.g. customer was refunded directly via remote panel)
                if ($remoteStatus === PaymentStatus::REFUNDED) {
                    return new TransitionResult(
                        TransitionResult::TYPE_SAFE_UPDATE,
                        "Safe refund sync: PAID -> REFUNDED."
                    );
                }

                // paid -> pending / authorized / failed is highly suspicious
                return new TransitionResult(
                    TransitionResult::TYPE_CONFLICT_REVIEW,
                    "CRITICAL: Local status is PAID but remote gateway reports {$remoteStatus}. Possible chargeback, manual reversal, or out-of-sync database."
                );

            case PaymentStatus::FAILED:
                // failed -> paid is highly suspicious (customer paid after we marked it as failed)
                return new TransitionResult(
                    TransitionResult::TYPE_CONFLICT_REVIEW,
                    "CRITICAL: Local status is FAILED but remote gateway reports {$remoteStatus}. Possible late transaction completion or duplicate charge."
                );

            case PaymentStatus::REFUNDED:
                // refunded is terminal
                return new TransitionResult(
                    TransitionResult::TYPE_CONFLICT_REVIEW,
                    "CRITICAL: Local status is REFUNDED but remote gateway reports {$remoteStatus}. Reversals of refunded status must be reviewed manually."
                );

            case PaymentStatus::EXPIRED:
                // expired -> paid is a late capturing issue
                return new TransitionResult(
                    TransitionResult::TYPE_CONFLICT_REVIEW,
                    "CRITICAL: Local status is EXPIRED but remote gateway reports {$remoteStatus}. Late payment capture on expired order."
                );
        }

        return new TransitionResult(
            TransitionResult::TYPE_CONFLICT_REVIEW,
            "Unknown transition path: local {$localStatus} -> remote {$remoteStatus}."
        );
    }
}
