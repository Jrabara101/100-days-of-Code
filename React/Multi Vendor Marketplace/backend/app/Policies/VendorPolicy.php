<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Vendor;

class VendorPolicy
{
    /**
     * Determine whether the user can view the vendor cockpit.
     */
    public function view(User $user, Vendor $vendor): bool
    {
        return $user->id === $vendor->user_id;
    }

    /**
     * Determine whether the user can update the vendor settings (e.g. vacation mode).
     */
    public function update(User $user, Vendor $vendor): bool
    {
        return $user->id === $vendor->user_id;
    }

    /**
     * Determine whether the user can withdraw funds.
     */
    public function withdraw(User $user, Vendor $vendor): bool
    {
        return $user->id === $vendor->user_id;
    }
}
