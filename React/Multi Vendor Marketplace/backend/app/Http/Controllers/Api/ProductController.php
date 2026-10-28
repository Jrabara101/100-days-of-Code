<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Vendor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    /**
     * Storefront Catalog with faceted filtering & vendor details.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Product::with(['vendor', 'variants'])->where('status', 'published');

        if ($request->has('category') && $request->category !== 'All') {
            $query->where('category', $request->category);
        }

        if ($request->has('search') && !empty($request->search)) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('title', 'like', "%{$s}%")
                  ->orWhere('description', 'like', "%{$s}%")
                  ->orWhere('category', 'like', "%{$s}%");
            });
        }

        $products = $query->latest()->get();

        return response()->json([
            'success' => true,
            'products' => $products,
        ]);
    }

    /**
     * Product details with interactive variant matrix.
     */
    public function show(string $idOrSlug): JsonResponse
    {
        $product = Product::with(['vendor', 'variants'])
            ->where('id', $idOrSlug)
            ->orWhere('slug', $idOrSlug)
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'product' => $product,
        ]);
    }

    /**
     * List all verified boutique studios.
     */
    public function vendors(): JsonResponse
    {
        $vendors = Vendor::where('status', 'active')->withCount('products')->get();

        return response()->json([
            'success' => true,
            'vendors' => $vendors,
        ]);
    }
}
