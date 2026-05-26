<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CloudinaryService
{
    public function upload(UploadedFile $file, ?string $folder = null): ?string
    {
        $cloudName = config('cloudinary.cloud_name');
        $apiKey    = config('cloudinary.api_key');
        $apiSecret = config('cloudinary.api_secret');

        if (! $cloudName || ! $apiKey || ! $apiSecret) {
            Log::warning('Cloudinary not configured');
            return null;
        }

        $folder    = $folder ?: config('cloudinary.folder');
        $timestamp = time();
        $toSign    = "folder={$folder}&timestamp={$timestamp}{$apiSecret}";
        $signature = sha1($toSign);

        $res = Http::asMultipart()
            ->attach('file', fopen($file->getRealPath(), 'r'), $file->getClientOriginalName())
            ->post("https://api.cloudinary.com/v1_1/{$cloudName}/image/upload", [
                ['name' => 'api_key',   'contents' => $apiKey],
                ['name' => 'folder',    'contents' => $folder],
                ['name' => 'timestamp', 'contents' => (string) $timestamp],
                ['name' => 'signature', 'contents' => $signature],
            ]);

        if (! $res->ok()) {
            Log::warning('Cloudinary upload failed', ['body' => $res->body()]);
            return null;
        }

        return $res->json('secure_url');
    }
}
