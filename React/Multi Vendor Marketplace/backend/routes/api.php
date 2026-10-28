<?php

use App\Http\Controllers\Api\DisputeController;
use App\Http\Controllers\Api\OperatorController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\VendorController;
use App\Jobs\ProcessStripeWebhookJob;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Multi-Vendor Marketplace API Routes
|--------------------------------------------------------------------------
*/

// Public Storefront & Discovery
Route::prefix('products')->group(function () {
    Route::get('/', [ProductController::class, 'index']);
    Route::get('/{idOrSlug}', [ProductController::class, 'show']);
});
Route::get('/vendors', [ProductController::class, 'vendors']);

// Unified Single Checkout & Orders
Route::post('/checkout', [OrderController::class, 'checkout']);
Route::get('/orders/{orderNumber}', [OrderController::class, 'show']);
Route::post('/sub-orders/{subOrderId}/verify-delivery', [OrderController::class, 'verifyDelivery']);

// Vendor Command Studio Portal
Route::prefix('vendors/{vendorId}')->group(function () {
    Route::get('/dashboard', [VendorController::class, 'dashboard']);
    Route::get('/sub-orders', [VendorController::class, 'subOrders']);
    Route::post('/withdraw', [VendorController::class, 'withdraw']);
    Route::post('/toggle-vacation', [VendorController::class, 'toggleVacation']);
    Route::post('/calculate-pricing', [VendorController::class, 'calculatePricing']);
});
Route::post('/sub-orders/{subOrderId}/mark-shipped', [VendorController::class, 'markShipped']);

// Zero-Hostility Resolution Desk
Route::post('/disputes/resolve', [DisputeController::class, 'resolve']);

// Marketplace Operator Governance
Route::prefix('operator')->group(function () {
    Route::get('/metrics', [OperatorController::class, 'metrics']);
    Route::post('/campaigns', [OperatorController::class, 'storeCampaign']);
});

// Stripe Connect Webhook Handler
Route::post('/webhooks/stripe', function (Request $request) {
    ProcessStripeWebhookJob::dispatch($request->all());
    return response()->json(['received' => true]);
});
