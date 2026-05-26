<?php

namespace App\Http\Controllers\Api\V1;

use App\Services\CloudinaryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class UploadController extends Controller
{
    public function __construct(protected CloudinaryService $cloudinary) {}

    public function image(Request $request): JsonResponse
    {
        $request->validate([
            'image' => ['required', 'file', 'image', 'max:5120'],
        ]);

        $url = $this->cloudinary->upload($request->file('image'));
        if (! $url) {
            return response()->json(['message' => 'Upload failed.'], 502);
        }

        return response()->json(['url' => $url]);
    }
}
