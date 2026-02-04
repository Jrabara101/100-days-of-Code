<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Check if admin exists
        if (!User::where('email', 'admin@example.com')->exists()) {
            User::factory()->create([
                'name' => 'Admin User',
                'email' => 'admin@example.com',
                'password' => Hash::make('password'),
            ]);
        }
        
        // Create some dummy users for the feed
        $users = User::factory(5)->create();
        
        // Seed Posts
        foreach ($users as $user) {
            \App\Models\Post::factory(3)->create([
                'user_id' => $user->id,
            ]);

            // Seed Stories
            \App\Models\Story::create([
                'user_id' => $user->id,
                'image_path' => 'https://picsum.photos/400/800?random=' . $user->id, // Placeholder
                'expires_at' => now()->addDay(),
            ]);
        }
    }
}
