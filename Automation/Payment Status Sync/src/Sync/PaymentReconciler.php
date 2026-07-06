<?php

namespace App\PaymentSync\Sync;

use App\PaymentSync\Gateway\PaymentGatewayInterface;
use App\PaymentSync\Gateway\Exception\OrderNotFoundException;
use App\PaymentSync\Gateway\Exception\GatewayTimeoutException;
use App\PaymentSync\Gateway\Exception\RateLimitExceededException;
use App\PaymentSync\Repository\OrderRepositoryInterface;
use App\PaymentSync\Model\Order;

class PaymentReconciler
{
    private OrderRepositoryInterface $repository;
    private PaymentGatewayInterface $gateway;
    private TransitionEngine $transitionEngine;
    private RetryHandler $retryHandler;

    public function __construct(
        OrderRepositoryInterface $repository,
        PaymentGatewayInterface $gateway,
        TransitionEngine $transitionEngine,
        RetryHandler $retryHandler
    ) {
        $this->repository = $repository;
        $this->gateway = $gateway;
        $this->transitionEngine = $transitionEngine;
        $this->retryHandler = $retryHandler;
    }

    /**
     * Reconcile orders in the local database against the remote gateway.
     *
     * @param array<Order> $orders
     * @param ?callable(string $orderId, int $progress, int $total): void $onProgressCallback
     * @param ?callable(string $orderId, string $reason, int $attempt, int $delayMs): void $onRetryCallback
     * @return array{
     *     results: array<array{
     *         orderId: string,
     *         amount: float,
     *         currency: string,
     *         localStatus: string,
     *         remoteStatus: ?string,
     *         type: string,
     *         message: string,
     *         retries: int
     *     }>,
     *     stats: array{
     *         total: int,
     *         noChange: int,
     *         safeUpdates: int,
     *         conflicts: int,
     *         networkErrorsRecovered: int,
     *         networkErrorsExhausted: int,
     *         missingRemotely: int
     *     }
     * }
     */
    public function reconcile(array $orders, ?callable $onProgressCallback = null, ?callable $onRetryCallback = null): array
    {
        $results = [];
        $stats = [
            'total' => count($orders),
            'noChange' => 0,
            'safeUpdates' => 0,
            'conflicts' => 0,
            'networkErrorsRecovered' => 0,
            'networkErrorsExhausted' => 0,
            'missingRemotely' => 0,
        ];

        $total = count($orders);
        foreach ($orders as $index => $order) {
            $orderId = $order->getId();

            if ($onProgressCallback !== null) {
                $onProgressCallback($orderId, $index + 1, $total);
            }

            $remoteStatus = null;
            $resultType = 'ERROR';
            $message = '';
            $retryCountForThisOrder = 0;

            try {
                // Execute fetching status with retry policy
                $remoteStatus = $this->retryHandler->execute(
                    function () use ($orderId) {
                        return $this->gateway->fetchStatus($orderId);
                    },
                    function (string $reason, int $attempt, int $delayMs) use ($orderId, $onRetryCallback, &$retryCountForThisOrder) {
                        $retryCountForThisOrder++;
                        if ($onRetryCallback !== null) {
                            $onRetryCallback($orderId, $reason, $attempt, $delayMs);
                        }
                    }
                );

                // Reconcile status transitions
                $transitionResult = $this->transitionEngine->evaluate($order->getStatus(), $remoteStatus);

                if ($transitionResult->isNoChange()) {
                    $resultType = 'NO_CHANGE';
                    $stats['noChange']++;
                    $message = $transitionResult->getMessage();
                } elseif ($transitionResult->isSafeUpdate()) {
                    // Update local storage
                    $this->repository->updateStatus($orderId, $remoteStatus);
                    $resultType = 'SAFE_UPDATE';
                    $stats['safeUpdates']++;
                    $message = $transitionResult->getMessage();
                } else {
                    $resultType = 'CONFLICT_REVIEW';
                    $stats['conflicts']++;
                    $message = $transitionResult->getMessage();
                }

                if ($retryCountForThisOrder > 0) {
                    $stats['networkErrorsRecovered']++;
                }

            } catch (OrderNotFoundException $e) {
                $resultType = 'MISSING_REMOTELY';
                $stats['missingRemotely']++;
                $message = $e->getMessage();
            } catch (GatewayTimeoutException | RateLimitExceededException $e) {
                $resultType = 'NETWORK_ERROR_EXHAUSTED';
                $stats['networkErrorsExhausted']++;
                $message = "Connection retries exhausted. Remote host timed out or rate limited. " . $e->getMessage();
            }

            $results[] = [
                'orderId' => $orderId,
                'amount' => $order->getAmount(),
                'currency' => $order->getCurrency(),
                'localStatus' => $order->getStatus(),
                'remoteStatus' => $remoteStatus,
                'type' => $resultType,
                'message' => $message,
                'retries' => $retryCountForThisOrder,
            ];
        }

        return [
            'results' => $results,
            'stats' => $stats,
        ];
    }
}
