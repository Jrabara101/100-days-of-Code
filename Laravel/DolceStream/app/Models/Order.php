<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = ['tracking_code', 'customer_name', 'customer_email', 'status', 'total_price', 'notes'];

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }
}
