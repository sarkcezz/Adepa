<?php

namespace App\Services;

use Google\Client as GoogleClient;
use Google\Service\Drive as GoogleDrive;
use Google\Service\Drive\DriveFile;
use Illuminate\Support\Facades\Log;

/**
 * Uploads a backup file to a shared Google Drive folder using a service
 * account credential. Service account auth means no OAuth refresh-token
 * dance and no human "log in once" step on the server.
 *
 * Setup (one-time, see docs/GOOGLE_DRIVE_BACKUP.md):
 *  1. Create a Google Cloud project + enable the Drive API
 *  2. Create a service account, download its JSON key
 *  3. Upload the JSON to /home/.../laravel/storage/app/google-drive-key.json
 *  4. In Google Drive, create a folder "adepa-backups"
 *  5. Share the folder with the service account's email (Editor role)
 *  6. Copy the folder ID from its URL → GOOGLE_DRIVE_FOLDER_ID in .env
 *  7. Set GOOGLE_DRIVE_KEY_FILE=storage/app/google-drive-key.json
 *
 * If credentials aren't configured, upload() returns false silently
 * (logged as a warning) — local-only backup still works.
 */
class GoogleDriveBackupService
{
    public function isConfigured(): bool
    {
        $keyFile  = config('services.google_drive.key_file');
        $folderId = config('services.google_drive.folder_id');
        return $keyFile && $folderId && file_exists(base_path($keyFile));
    }

    /**
     * Upload a local file to the configured Google Drive folder.
     * Returns the uploaded file's Drive ID, or null on failure.
     */
    public function upload(string $localPath, string $remoteName): ?string
    {
        if (! $this->isConfigured()) {
            Log::warning('GoogleDriveBackupService: not configured, skipping upload', ['file' => $remoteName]);
            return null;
        }
        if (! file_exists($localPath)) {
            Log::warning('GoogleDriveBackupService: local file missing', ['path' => $localPath]);
            return null;
        }

        try {
            $client = new GoogleClient();
            $client->setAuthConfig(base_path(config('services.google_drive.key_file')));
            $client->addScope(GoogleDrive::DRIVE_FILE);

            $drive = new GoogleDrive($client);

            $meta = new DriveFile([
                'name'    => $remoteName,
                'parents' => [config('services.google_drive.folder_id')],
            ]);

            $uploaded = $drive->files->create($meta, [
                'data'       => file_get_contents($localPath),
                'mimeType'   => mime_content_type($localPath) ?: 'application/gzip',
                'uploadType' => 'multipart',
                'fields'     => 'id, name, size',
            ]);

            Log::info('Backup uploaded to Google Drive', [
                'file' => $remoteName,
                'id'   => $uploaded->id,
                'size' => $uploaded->size ?? null,
            ]);

            return $uploaded->id;
        } catch (\Throwable $e) {
            Log::error('GoogleDriveBackupService: upload failed', [
                'file'  => $remoteName,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Prune backups older than $keepDays from the Drive folder.
     */
    public function prune(int $keepDays = 30): int
    {
        if (! $this->isConfigured()) return 0;

        try {
            $client = new GoogleClient();
            $client->setAuthConfig(base_path(config('services.google_drive.key_file')));
            $client->addScope(GoogleDrive::DRIVE_FILE);
            $drive = new GoogleDrive($client);

            $folderId = config('services.google_drive.folder_id');
            $cutoff   = now()->subDays($keepDays)->toRfc3339String();

            $resp = $drive->files->listFiles([
                'q'      => "'{$folderId}' in parents and createdTime < '{$cutoff}' and trashed = false",
                'fields' => 'files(id, name)',
            ]);

            $deleted = 0;
            foreach ($resp->getFiles() as $f) {
                $drive->files->delete($f->getId());
                $deleted++;
                Log::info('Pruned old Drive backup', ['name' => $f->getName()]);
            }
            return $deleted;
        } catch (\Throwable $e) {
            Log::error('GoogleDriveBackupService: prune failed', ['error' => $e->getMessage()]);
            return 0;
        }
    }
}
