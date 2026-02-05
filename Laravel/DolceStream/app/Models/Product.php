<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable = ['name', 'description', 'base_price', 'image_path', 'is_active', 'stock'];

    public function orderItems()
    {
        return $this->morphMany(OrderItem::class, 'buyable');
    }
}
