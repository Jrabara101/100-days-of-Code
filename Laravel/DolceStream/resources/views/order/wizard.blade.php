@extends('layouts.app')

@section('content')
<div class="container" x-data="cakeWizard()">
    <div class="row justify-content-center">
        <div class="col-md-8">
            <div class="card border-0 shadow-lg rounded-4 overflow-hidden">
                <div class="card-header bg-white border-0 py-4 text-center">
                    <h2 class="fw-bold text-gold mb-0">Design Your Dream Cake</h2>
                    <p class="text-muted small mt-2">Step <span x-text="step"></span> of 4</p>
                    <div class="progress" style="height: 5px;">
                        <div class="progress-bar bg-pink" role="progressbar" :style="'width: ' + (step/4*100) + '%'"></div>
                    </div>
                </div>

                <div class="card-body p-5">
                    <form action="{{ route('order.store') }}" method="POST" enctype="multipart/form-data">
                        @csrf
                        
                        <!-- Step 1: Base -->
                        <div x-show="step === 1" x-transition>
                            <h4 class="mb-4">Choose Base Size</h4>
                            <div class="row g-3">
                                @foreach(['6inch' => '6" Mini (₱500)', '8inch' => '8" Standard (+₱300)', '10inch' => '10" Party (+₱600)'] as $val => $label)
                                <div class="col-md-4">
                                    <input type="radio" class="btn-check" name="size" id="{{ $val }}" value="{{ $val }}" x-model="size" required>
                                    <label class="btn btn-outline-light text-dark border-secondary w-100 py-4" for="{{ $val }}">
                                        {{ $label }}
                                    </label>
                                </div>
                                @endforeach
                            </div>
                        </div>

                        <!-- Step 2: Flavor -->
                        <div x-show="step === 2" x-transition style="display: none;">
                            <h4 class="mb-4">Select Flavor</h4>
                            <select class="form-select form-select-lg mb-3" name="flavor" x-model="flavor" required>
                                <option value="" disabled>Select a flavor</option>
                                <option value="vanilla">Classic Vanilla</option>
                                <option value="chocolate">Rich Chocolate (+₱50)</option>
                                <option value="red_velvet">Red Velvet (+₱100)</option>
                            </select>
                            
                            <h5 class="mt-4">Filling (Optional)</h5>
                            <input type="text" class="form-control" name="filling" placeholder="e.g. Strawberry Jam, Cream Cheese">
                        </div>

                        <!-- Step 3: Customization -->
                        <div x-show="step === 3" x-transition style="display: none;">
                            <h4 class="mb-4">Personalize It</h4>
                            <div class="mb-3">
                                <label class="form-label">Message on Cake</label>
                                <input type="text" class="form-control" name="message" placeholder="Happy Birthday!">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Inspiration Photo</label>
                                <input type="file" class="form-control" name="reference_image" accept="image/*">
                                <div class="form-text">Upload a design reference (Max 5MB).</div>
                            </div>
                        </div>

                        <!-- Step 4: Details & Review -->
                        <div x-show="step === 4" x-transition style="display: none;">
                            <h4 class="mb-4">Final Details</h4>
                            <div class="mb-3">
                                <label class="form-label">Your Name</label>
                                <input type="text" class="form-control" name="customer_name" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Email Address</label>
                                <input type="email" class="form-control" name="customer_email" required>
                            </div>

                            <div class="alert alert-light border mt-4">
                                <h6>Estimated Total: <span class="fw-bold text-gold" x-text="'₱' + calculateTotal()"></span></h6>
                            </div>
                        </div>

                        <!-- Navigation -->
                        <div class="d-flex justify-content-between mt-5">
                            <button type="button" class="btn btn-secondary" x-show="step > 1" @click="step--">Back</button>
                            <button type="button" class="btn btn-primary px-5" x-show="step < 4" @click="if(validateStep()) step++">Next</button>
                            <button type="submit" class="btn btn-success px-5" x-show="step === 4">Place Order</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
    function cakeWizard() {
        return {
            step: 1,
            size: '',
            flavor: '',
            
            validateStep() {
                if (this.step === 1 && !this.size) { alert('Please select a size'); return false; }
                if (this.step === 2 && !this.flavor) { alert('Please select a flavor'); return false; }
                return true;
            },
            calculateTotal() {
                let total = 500;
                if (this.size === '8inch') total += 300;
                if (this.size === '10inch') total += 600;
                if (this.flavor === 'chocolate') total += 50;
                if (this.flavor === 'red_velvet') total += 100;
                return total;
            }
        }
    }
</script>
@endsection
