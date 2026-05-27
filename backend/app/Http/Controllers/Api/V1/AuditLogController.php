<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class AuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = AuditLog::query()->orderByDesc('created_at');

        if ($action = $request->query('action')) {
            $q->where('action', 'like', "{$action}%");
        }
        if ($userId = $request->query('user_id')) {
            $q->where('user_id', $userId);
        }
        if ($from = $request->query('from')) {
            $q->where('created_at', '>=', $from);
        }
        if ($to = $request->query('to')) {
            $q->where('created_at', '<=', $to);
        }
        if ($search = $request->query('q')) {
            $q->where(function ($qq) use ($search) {
                $qq->where('subject_label', 'like', "%{$search}%")
                   ->orWhere('user_name', 'like', "%{$search}%")
                   ->orWhere('note', 'like', "%{$search}%");
            });
        }

        return response()->json($q->paginate(50));
    }
}
