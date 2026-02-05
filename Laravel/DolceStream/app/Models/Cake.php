<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cake extends Model
{
    protected $fillable = ['specifications', 'reference_image_path', 'calculated_price'];

    protected $casts = [
        'specifications' => 'array',
    ];

    public function orderItems()
    {
        return $this->morphMany(OrderItem::class, 'buyable');
    }
}
