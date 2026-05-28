<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * Uploads database backups to off-site object storage. Defaults to
 * Backblaze B2 (via its S3-compatible API), but any S3-compatible
 * filesystem disk works — change OFFSITE_DISK in .env.
 *
 * Backblaze B2 is preferred because:
 *  - 10GB free tier (plenty for a SQL dump per night for years)
 *  - No service-account-storage-quota nonsense like Google Drive has
 *  - Pay-as-you-go ($0.005/GB/mo) if you outgrow free tier
 *
 * Setup walkthrough: docs/BACKBLAZE_BACKUP.md
 */
class OffsiteBackupService
{
    public function __construct(
        protected ?string $diskName = null,
    ) {
        $this->diskName ??= config('services.offsite_backup.disk', 'b2');
    }

    /**
     * Are credentials configured well enough to attempt an upload?
     */
    public function isConfigured(): bool
    {
        $cfg = config("filesystems.disks.{$this->diskName}", []);
        return ! empty($cfg['key']) && ! empty($cfg['secret']) && ! empty($cfg['bucket']);
    }

    /**
     * Upload a local file to the off-site disk under "backups/{remoteName}".
     * Returns the remote path on success, null on failure.
     */
    public function upload(string $localPath, string $remoteName): ?string
    {
        if (! $this->isConfigured()) {
            Log::warning('OffsiteBackup: not configured, skipping upload', ['file' => $remoteName]);
            return null;
        }
        if (! file_exists($localPath)) {
            Log::warning('OffsiteBackup: local file missing', ['path' => $localPath]);
            return null;
        }

        $remote = "backups/{$remoteName}";

        try {
            $disk = Storage::disk($this->diskName);
            $disk->put($remote, file_get_contents($localPath));

            Log::info('Backup uploaded off-site', [
                'disk'   => $this->diskName,
                'remote' => $remote,
                'bytes'  => filesize($localPath),
            ]);

            return $remote;
        } catch (\Throwable $e) {
            Log::error('OffsiteBackup: upload failed', [
                'disk'  => $this->diskName,
                'file'  => $remoteName,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Delete backups older than $keepDays from the off-site disk.
     * Returns the number of files pruned.
     */
    public function prune(int $keepDays = 30): int
    {
        if (! $this->isConfigured()) return 0;

        $cutoff = now()->subDays($keepDays)->timestamp;
        $deleted = 0;

        try {
            $disk = Storage::disk($this->diskName);
            foreach ($disk->files('backups') as $path) {
                $lastModified = $disk->lastModified($path);
                if ($lastModified && $lastModified < $cutoff) {
                    $disk->delete($path);
                    $deleted++;
                    Log::info('Pruned off-site backup', ['remote' => $path]);
                }
            }
        } catch (\Throwable $e) {
            Log::error('OffsiteBackup: prune failed', ['error' => $e->getMessage()]);
        }

        return $deleted;
    }
}
