<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class NotificationController extends Controller
{
    public function mine(Request $request): JsonResponse
    {
        $list = Notification::where('user_id', $request->user()->id)
            ->orderByDesc('created_at')->paginate(30);
        return response()->json($list);
    }

    public function markRead(Request $request, string $id): JsonResponse
    {
        $n = Notification::where('user_id', $request->user()->id)->findOrFail($id);
        $n->update(['is_read' => true]);
        return response()->json($n);
    }
}
