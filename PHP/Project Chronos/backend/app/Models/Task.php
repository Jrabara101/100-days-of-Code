<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    use HasFactory;

    protected $fillable = [
        'title', 
        'description', 
        'status', 
        'priority', 
        'due_date', 
        'estimated_time_minutes', 
        'actual_completion_minutes',
        'user_id'
    ];

    protected $casts = [
        'due_date' => 'datetime',
    ];

    public function subtasks()
    {
        return $this->hasMany(Subtask::class);
    }

    public function reminders()
    {
        return $this->hasMany(Reminder::class);
    }

    public function history()
    {
        return $this->hasMany(TaskHistory::class);
    }
}
