<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\Cake;
use App\Models\OrderItem;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    public function create()
    {
        return view('order.wizard');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'size' => 'required|string',
            'flavor' => 'required|string',
            'filling' => 'nullable|string',
            'message' => 'nullable|string|max:50',
            'reference_image' => 'nullable|image|max:5120', // 5MB
            'customer_name' => 'required|string',
            'customer_email' => 'required|email',
        ]);

        // Handle Image
        $imagePath = null;
        if ($request->hasFile('reference_image')) {
            $imagePath = $request->file('reference_image')->store('uploads', 'public');
        }

        // Calculate Price (Basic)
        $basePrice = 500; 
        $sizeMap = ['6inch' => 0, '8inch' => 300, '10inch' => 600];
        $flavorMap = ['vanilla' => 0, 'chocolate' => 50, 'red_velvet' => 100];
        
        $price = $basePrice + ($sizeMap[$request->size] ?? 0) + ($flavorMap[$request->flavor] ?? 0);

        // Create Custom Cake
        $specs = [
            'size' => $request->size,
            'flavor' => $request->flavor,
            'filling' => $request->filling ?? 'None',
            'message' => $request->message,
        ];

        $cake = Cake::create([
            'specifications' => $specs,
            'reference_image_path' => $imagePath,
            'calculated_price' => $price,
        ]);

        // Create Order
        $order = Order::create([
            'tracking_code' => Str::upper(Str::random(8)),
            'customer_name' => $request->customer_name,
            'customer_email' => $request->customer_email,
            'status' => 'pending',
            'total_price' => $price,
        ]);

        // Create OrderItem
        $order->items()->create([
            'buyable_type' => Cake::class,
            'buyable_id' => $cake->id,
            'quantity' => 1,
            'price' => $price,
            'custom_options' => $specs,
        ]);

        return redirect()->route('order.track', $order->tracking_code);
    }

    public function show($tracking_code)
    {
        $order = Order::where('tracking_code', $tracking_code)->with('items.buyable')->firstOrFail();
        return view('order.track', compact('order'));
    }

    public function index()
    {
        $orders = Order::with('items.buyable')->latest()->get();
        return view('admin.dashboard', compact('orders'));
    }

    public function updateStatus(Request $request, $id)
    {
        $order = Order::findOrFail($id);
        $order->update(['status' => $request->status]);
        return back();
    }
}
