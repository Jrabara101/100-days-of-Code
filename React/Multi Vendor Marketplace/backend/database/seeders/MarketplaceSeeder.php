<?php

namespace Database\Seeders;

use App\Models\CoopCampaign;
use App\Models\ParentOrder;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\SubOrder;
use App\Models\SubOrderItem;
use App\Models\User;
use App\Models\Vendor;
use App\Models\VendorLedgerEntry;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class MarketplaceSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create Default Users for Vendors
        $userKoto = User::create([
            'name' => 'Ren Koto',
            'email' => 'ren@atelierkoto.jp',
            'password' => bcrypt('password123'),
        ]);

        $userBotanica = User::create([
            'name' => 'Inês Silva',
            'email' => 'ines@lisbonbotanica.pt',
            'password' => bcrypt('password123'),
        ]);

        $userNordic = User::create([
            'name' => 'Astrid Lind',
            'email' => 'astrid@nordicloom.no',
            'password' => bcrypt('password123'),
        ]);

        $userForma = User::create([
            'name' => 'Matteo Rossi',
            'email' => 'matteo@formamilano.it',
            'password' => bcrypt('password123'),
        ]);

        // 2. Seed Vendors
        $vendorKoto = Vendor::create([
            'id' => (string) Str::uuid(),
            'user_id' => $userKoto->id,
            'shop_name' => 'Atelier Koto',
            'slug' => 'atelier-koto',
            'logo_url' => 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=160&auto=format&fit=crop&q=80',
            'banner_url' => 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=1400&auto=format&fit=crop&q=80',
            'story_bio' => 'Generational ceramic studio based in Kyoto, Japan. We blend 400-year-old stoneware wood-firing traditions with contemporary tabletop ergonomics.',
            'origin_country' => 'JP',
            'origin_city' => 'Kyoto, Japan',
            'commission_rate_bps' => 1000, // 10.00%
            'free_shipping_threshold_cents' => 7500, // $75.00
            'flat_shipping_rate_cents' => 800, // $8.00
            'avg_ship_hours' => 24,
            'on_time_ship_pct' => 99.2,
            'response_time_text' => '< 2 hrs',
            'rating_avg' => 4.96,
            'reviews_count' => 418,
            'stripe_connect_account_id' => 'acct_1NkotoKYOTO992',
            'is_vacation_mode' => false,
            'status' => 'active',
            'tier' => 'Maker Partner',
            'escrow_balance_cents' => 184000,
            'available_balance_cents' => 362000,
        ]);

        $vendorBotanica = Vendor::create([
            'id' => (string) Str::uuid(),
            'user_id' => $userBotanica->id,
            'shop_name' => 'Lisbon Botanica',
            'slug' => 'lisbon-botanica',
            'logo_url' => 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=160&auto=format&fit=crop&q=80',
            'banner_url' => 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=1400&auto=format&fit=crop&q=80',
            'story_bio' => 'Wild-harvested cold-pressed botanical oils, raw beeswax candles, and artisanal room fragrances crafted in small batches along the sun-drenched Sintra hills.',
            'origin_country' => 'PT',
            'origin_city' => 'Lisbon, Portugal',
            'commission_rate_bps' => 1000,
            'free_shipping_threshold_cents' => 5000,
            'flat_shipping_rate_cents' => 600,
            'avg_ship_hours' => 24,
            'on_time_ship_pct' => 98.4,
            'response_time_text' => '< 1 hr',
            'rating_avg' => 4.92,
            'reviews_count' => 312,
            'stripe_connect_account_id' => 'acct_1NlisbonBOTANICA11',
            'is_vacation_mode' => false,
            'status' => 'active',
            'tier' => 'Maker Partner',
            'escrow_balance_cents' => 98000,
            'available_balance_cents' => 241050,
        ]);

        $vendorNordic = Vendor::create([
            'id' => (string) Str::uuid(),
            'user_id' => $userNordic->id,
            'shop_name' => 'Nordic Loom Studio',
            'slug' => 'nordic-loom',
            'logo_url' => 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=160&auto=format&fit=crop&q=80',
            'banner_url' => 'https://images.unsplash.com/photo-1528458876885-544243324950?w=1400&auto=format&fit=crop&q=80',
            'story_bio' => 'Hand-loomed organic Merino wool throws, stone-washed European flax table linens, and raw canvas totes tailored in Bergen, Norway.',
            'origin_country' => 'NO',
            'origin_city' => 'Bergen, Norway',
            'commission_rate_bps' => 800,
            'free_shipping_threshold_cents' => 12000,
            'flat_shipping_rate_cents' => 1200,
            'avg_ship_hours' => 36,
            'on_time_ship_pct' => 97.8,
            'response_time_text' => '< 3 hrs',
            'rating_avg' => 4.89,
            'reviews_count' => 195,
            'stripe_connect_account_id' => 'acct_1NnordicLOOM441',
            'is_vacation_mode' => false,
            'status' => 'active',
            'tier' => 'Pro Studio Tier',
            'escrow_balance_cents' => 245000,
            'available_balance_cents' => 489000,
        ]);

        $vendorForma = Vendor::create([
            'id' => (string) Str::uuid(),
            'user_id' => $userForma->id,
            'shop_name' => 'Forma Studio Milano',
            'slug' => 'forma-milano',
            'logo_url' => 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=160&auto=format&fit=crop&q=80',
            'banner_url' => 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1400&auto=format&fit=crop&q=80',
            'story_bio' => 'Architectural cast bronze, turned solid brass stationery, and sculptural desk objets designed in Milan.',
            'origin_country' => 'IT',
            'origin_city' => 'Milan, Italy',
            'commission_rate_bps' => 1000,
            'free_shipping_threshold_cents' => 9000,
            'flat_shipping_rate_cents' => 1000,
            'avg_ship_hours' => 24,
            'on_time_ship_pct' => 99.4,
            'response_time_text' => '< 1 hr',
            'rating_avg' => 4.98,
            'reviews_count' => 540,
            'stripe_connect_account_id' => 'acct_1NformaMILANO883',
            'is_vacation_mode' => false,
            'status' => 'active',
            'tier' => 'Maker Partner',
            'escrow_balance_cents' => 142000,
            'available_balance_cents' => 512000,
        ]);

        // 3. Seed Products & Variants
        $prodKoto1 = Product::create([
            'id' => (string) Str::uuid(),
            'vendor_id' => $vendorKoto->id,
            'category' => 'Home & Ceramics',
            'title' => 'Hasami Stoneware Pour-Over Dripper & Server',
            'slug' => 'hasami-stoneware-pour-over-dripper-server',
            'description' => 'Carved from high-density Amakusa ceramic stone and clay from Kyushu. Features a 60-degree internal rib geometry engineered for smooth extraction.',
            'images' => [
                'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80',
            ],
            'status' => 'published',
            'rating_avg' => 4.95,
            'reviews_count' => 128,
            'provenance_badge' => '⚡ Ships in 24h',
            'dimensional_reviews' => [
                'sizing' => 'True to Size',
                'craftsmanship' => 5.0,
                'packaging_care' => 4.9,
            ],
        ]);

        ProductVariant::create([
            'id' => (string) Str::uuid(),
            'product_id' => $prodKoto1->id,
            'sku' => 'KTO-DRIP-SLT-500',
            'title' => '500ml / Natural Slate Glaze',
            'attributes' => ['size' => '500ml', 'color' => 'Natural Slate'],
            'price_cents' => 6800,
            'compare_at_price_cents' => 7800,
            'stock_quantity' => 12,
            'velocity_days_left' => 4,
            'weight_grams' => 620,
        ]);

        ProductVariant::create([
            'id' => (string) Str::uuid(),
            'product_id' => $prodKoto1->id,
            'sku' => 'KTO-DRIP-SLT-800',
            'title' => '800ml Large / Natural Slate Glaze',
            'attributes' => ['size' => '800ml', 'color' => 'Natural Slate'],
            'price_cents' => 8600,
            'compare_at_price_cents' => 9400,
            'stock_quantity' => 18,
            'velocity_days_left' => 7,
            'weight_grams' => 850,
        ]);

        $prodBotanica1 = Product::create([
            'id' => (string) Str::uuid(),
            'vendor_id' => $vendorBotanica->id,
            'category' => 'Pantry & Apothecary',
            'title' => 'Sintra Pine Needle & Wild Bergamot Beeswax Candle',
            'slug' => 'sintra-pine-wild-bergamot-beeswax-candle',
            'description' => 'Poured into heavy amber laboratory glass with an unbleached organic cotton wick. Infused with wild-harvested resins.',
            'images' => [
                'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=800&auto=format&fit=crop&q=80',
            ],
            'status' => 'published',
            'rating_avg' => 4.94,
            'reviews_count' => 215,
            'provenance_badge' => '🌿 Pure Beeswax',
        ]);

        ProductVariant::create([
            'id' => (string) Str::uuid(),
            'product_id' => $prodBotanica1->id,
            'sku' => 'BOT-CNDL-PNE-280',
            'title' => '280g / Amber Glass (65h Burn)',
            'attributes' => ['size' => '280g', 'scent' => 'Sintra Pine'],
            'price_cents' => 3800,
            'compare_at_price_cents' => 4200,
            'stock_quantity' => 14,
            'velocity_days_left' => 5,
            'weight_grams' => 520,
        ]);

        // 4. Seed Co-op Campaign
        CoopCampaign::create([
            'id' => (string) Str::uuid(),
            'title' => '🍂 Autumn Tableware & Warm Lighting Week',
            'slug' => 'autumn-design-week',
            'discount_pct' => 20,
            'marketplace_subsidy_pct' => 10,
            'vendor_contribution_pct' => 10,
            'status' => 'active',
            'end_date' => 'Nov 04, 2026',
        ]);
    }
}
