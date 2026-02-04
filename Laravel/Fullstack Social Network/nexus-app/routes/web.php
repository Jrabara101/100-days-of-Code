<?php

use App\Http\Controllers\PostController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->group(function () {
    Route::get('/', [PostController::class, 'index'])->name('home');
    Route::post('/posts', [PostController::class, 'store'])->name('posts.store');
    Route::get('/profile/{user}', [ProfileController::class, 'show'])->name('profile.show');
});

// Auto-Login Route for Demo
Route::get('/login', function () {
    auth()->login(\App\Models\User::find(1));
    return redirect()->route('home');
})->name('login');
