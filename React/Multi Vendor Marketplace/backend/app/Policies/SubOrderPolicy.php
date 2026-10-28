<?php

namespace App\Policies;

use App\Models\SubOrder;
use App\Models\User;

class SubOrderPolicy
{
    /**
     * Determine whether the user can view, pack, or dispatch this specific sub-order.
     * The sub-order must belong to the maker's vendor_id.
     */
    public function view(User $user, SubOrder $subOrder): bool
    {
        return $subOrder->vendor && $subOrder->vendor->user_id === $user->id;
    }

    /**
     * Determine whether the user can dispatch and assign tracking to this sub-order.
     */
    public function ship(User $user, SubOrder $subOrder): bool
    {
        return $subOrder->vendor && $subOrder->vendor->user_id === $user->id;
    }

    /**
     * Determine whether the user can issue a zero-hostility partial refund.
     */
    public function refund(User $user, SubOrder $subOrder): bool
    {
        return $subOrder->vendor && $subOrder->vendor->user_id === $user->id;
    }
}
