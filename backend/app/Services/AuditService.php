<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

/**
 * Centralised audit logging.
 *
 * Call AuditService::log('action', $subject, [...]) from controllers/services
 * after significant write actions. Read actions are NOT logged to keep the
 * table from exploding.
 */
class AuditService
{
    public static function log(
        string $action,
        Model|null $subject = null,
        array $changes = [],
        ?string $note = null,
        ?User $actor = null,
    ): AuditLog {
        /** @var User|null $user */
        $user = $actor ?? auth()->user();

        /** @var Request|null $request */
        $request = request();

        return AuditLog::create([
            'user_id'      => $user?->id,
            'user_name'    => $user?->name,
            'user_role'    => $user?->role,
            'action'       => $action,
            'subject_type' => $subject ? class_basename($subject) : null,
            'subject_id'   => $subject?->getKey(),
            'subject_label'=> static::label($subject),
            'changes'      => $changes ?: null,
            'note'         => $note,
            'ip'           => $request?->ip(),
            'user_agent'   => substr((string) $request?->userAgent(), 0, 255),
        ]);
    }

    protected static function label(?Model $subject): ?string
    {
        if (! $subject) return null;
        foreach (['name', 'title', 'order_number', 'code', 'email'] as $attr) {
            $val = $subject->getAttribute($attr);
            if (!empty($val)) return (string) $val;
        }
        return null;
    }
}
