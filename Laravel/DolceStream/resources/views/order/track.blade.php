@extends('layouts.app')

@section('content')
<div class="container">
    <div class="row justify-content-center">
        <div class="col-md-10">
            <div class="card shadow-sm border-0">
                <div class="card-body p-5">
                    <div class="text-center mb-5">
                        <h1 class="display-6 fw-bold">Order Tracking</h1>
                        <p class="text-muted">Tracking Code: <span class="badge bg-secondary font-monospace">{{ $order->tracking_code }}</span></p>
                    </div>

                    <div class="position-relative m-4">
                        <div class="progress" style="height: 4px;">
                            <div class="progress-bar bg-pink" role="progressbar" style="width: {{ $order->status === 'completed' ? 100 : ($order->status === 'ready' ? 75 : ($order->status === 'decorating' ? 50 : ($order->status === 'baking' ? 25 : 5))) }}%;"></div>
                        </div>
                        <div class="d-flex justify-content-between position-absolute top-0 w-100 translate-middle-y">
                            @foreach(['pending', 'baking', 'decorating', 'ready', 'completed'] as $s)
                                <div class="text-center bg-white px-2">
                                    <div class="rounded-circle border {{ $order->status === $s || in_array($order->status, ['ready', 'completed']) ? 'bg-pink text-white' : 'bg-light text-muted' }} d-flex align-items-center justify-content-center" style="width: 40px; height: 40px; border-width: 2px !important;">
                                        @if($s == 'pending') 📝 @elseif($s == 'baking') 🥣 @elseif($s == 'decorating') 🎨 @elseif($s == 'ready') 🎁 @else ✅ @endif
                                    </div>
                                    <small class="d-block mt-2 text-capitalize {{ $order->status === $s ? 'fw-bold text-dark' : 'text-muted' }}">{{ $s }}</small>
                                </div>
                            @endforeach
                        </div>
                    </div>

                    <div class="mt-5 pt-5">
                        <h5>Order Details</h5>
                        <ul class="list-group list-group-flush">
                            <!-- Accessing via OrderItem assuming single custom cake for now -->
                            <li class="list-group-item d-flex justify-content-between">
                                <span>Cake Size</span>
                                <strong>{{ $order->items->first()->custom_options['size'] ?? 'N/A' }}</strong>
                            </li>
                            <li class="list-group-item d-flex justify-content-between">
                                <span>Flavor</span>
                                <strong>{{ $order->items->first()->custom_options['flavor'] ?? 'N/A' }}</strong>
                            </li>
                            <li class="list-group-item d-flex justify-content-between">
                                <span>Message</span>
                                <strong>{{ $order->items->first()->custom_options['message'] ?? 'None' }}</strong>
                            </li>
                             <li class="list-group-item d-flex justify-content-between">
                                <span>Total Price</span>
                                <strong class="text-gold">₱{{ number_format($order->total_price, 2) }}</strong>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
