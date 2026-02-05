@extends('layouts.app')

@section('content')
<div class="container">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h2 class="fw-bold text-dark">Baker's Production Queue</h2>
        <a href="{{ route('home') }}" class="btn btn-outline-secondary">Back to Shop</a>
    </div>
    
    <div class="card shadow-sm border-0">
        <div class="card-body p-0">
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                    <thead class="bg-light">
                        <tr>
                            <th class="ps-4">Tracking</th>
                            <th>Customer</th>
                            <th>Cake Details</th>
                            <th>Inspiration</th>
                            <th>Current Status</th>
                            <th class="pe-4">Update Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($orders as $order)
                        <tr>
                            <td class="ps-4"><code class="text-primary">{{ $order->tracking_code }}</code></td>
                            <td>
                                <div class="fw-bold">{{ $order->customer_name }}</div>
                                <small class="text-muted">{{ $order->customer_email }}</small>
                            </td>
                            <td>
                                @if($item = $order->items->first())
                                    <span class="badge bg-light text-dark border">{{ $item->custom_options['size'] ?? 'N/A' }}</span>
                                    <span class="badge bg-light text-dark border">{{ $item->custom_options['flavor'] ?? 'N/A' }}</span>
                                    @if(isset($item->custom_options['message']) && $item->custom_options['message'])
                                        <div class="small mt-1 text-muted">"{{ $item->custom_options['message'] }}"</div>
                                    @endif
                                @endif
                            </td>
                            <td>
                                @if($item && $item->buyable && $item->buyable->reference_image_path)
                                    <a href="{{ asset('storage/' . $item->buyable->reference_image_path) }}" target="_blank" class="btn btn-sm btn-outline-primary">View Image</a>
                                @else
                                    <span class="text-muted small">None</span>
                                @endif
                            </td>
                            <td>
                                <span class="badge {{ match($order->status) {
                                    'pending' => 'bg-warning text-dark',
                                    'baking' => 'bg-danger',
                                    'decorating' => 'bg-info',
                                    'ready' => 'bg-success',
                                    'completed' => 'bg-secondary',
                                    default => 'bg-light text-dark'
                                } }}">
                                    {{ ucfirst($order->status) }}
                                </span>
                            </td>
                            <td class="pe-4">
                                <form action="{{ route('admin.order.update', $order->id) }}" method="POST">
                                    @csrf
                                    @method('PATCH')
                                    <select name="status" class="form-select form-select-sm border-primary" onchange="this.form.submit()" style="width: 130px;">
                                        @foreach(['pending', 'baking', 'decorating', 'ready', 'completed'] as $status)
                                            <option value="{{ $status }}" {{ $order->status == $status ? 'selected' : '' }}>
                                                {{ ucfirst($status) }}
                                            </option>
                                        @endforeach
                                    </select>
                                </form>
                            </td>
                        </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>
@endsection
