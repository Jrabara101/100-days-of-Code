<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class WarehouseEtlDemoSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed OLTP Users
        $users = [];
        for ($i = 1; $i <= 50; $i++) {
            $users[] = [
                'id' => $i,
                'name' => "Customer {$i}",
                'email' => "user{$i}@enterprise.com",
                'password' => bcrypt('secret'),
                'created_at' => now()->subDays(rand(1, 30))->toDateTimeString(),
                'updated_at' => now()->toDateTimeString(),
            ];
        }
        DB::table('users')->insertOrIgnore($users);

        // 2. Seed OLTP Orders
        $orders = [];
        for ($i = 1; $i <= 2500; $i++) {
            $totalCents = rand(5000, 150000);
            $taxCents = (int) round($totalCents * 0.08);
            $discountCents = rand(0, 1) ? 1000 : 0;

            $orders[] = [
                'id' => $i,
                'user_id' => rand(1, 50),
                'status' => rand(0, 10) > 1 ? 'completed' : 'refunded',
                'total_amount_cents' => $totalCents,
                'tax_amount_cents' => $taxCents,
                'discount_amount_cents' => $discountCents,
                'created_at' => now()->subHours(rand(1, 72))->toDateTimeString(),
                'updated_at' => now()->subMinutes(rand(1, 120))->toDateTimeString(),
            ];
        }

        // Chunk inserts to comply with SQL parameter limits
        foreach (array_chunk($orders, 500) as $chunk) {
            DB::table('orders')->insertOrIgnore($chunk);
        }
    }
}
