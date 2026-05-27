<?php

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    use HasUuid;

    public $timestamps = false;   // we only set created_at

    protected $fillable = [
        'id', 'user_id', 'user_name', 'user_role',
        'action', 'subject_type', 'subject_id', 'subject_label',
        'changes', 'note', 'ip', 'user_agent', 'created_at',
    ];

    protected function casts(): array
    {
        return [
            'changes'    => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
