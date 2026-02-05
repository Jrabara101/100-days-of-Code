<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    protected $fillable = ['order_id', 'buyable_type', 'buyable_id', 'quantity', 'price', 'custom_options'];

    protected $casts = [
        'custom_options' => 'array',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function buyable()
    {
        return $this->morphTo();
    }
}
