<?php

use App\Http\Controllers\OrderController;

Route::get('/', [OrderController::class, 'create'])->name('home');
Route::post('/order', [OrderController::class, 'store'])->name('order.store');
Route::get('/track/{tracking_code}', [OrderController::class, 'show'])->name('order.track');

// Admin Routes (Unprotected for demo purposes as per prompt requirements focus on features)
Route::get('/admin/orders', [OrderController::class, 'index'])->name('admin.orders');
Route::patch('/admin/orders/{id}', [OrderController::class, 'updateStatus'])->name('admin.order.update');
