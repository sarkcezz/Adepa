<?php

namespace App\Console\Commands;

use App\Services\GoogleDriveBackupService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;

/**
 * Pure-PHP MySQL backup. Hostinger shared hosting disables exec(), so we
 * can't shell out to mysqldump. Instead we iterate every table, dump
 * CREATE TABLE + INSERT statements, gzip the result, and store under
 * storage/app/backups/.
 *
 * Keeps the most recent 7 files; older ones are pruned automatically.
 *
 * Runs daily at 02:00 via routes/console.php scheduling.
 */
class BackupDatabase extends Command
{
    protected $signature = 'adepa:backup
                            {--keep=7 : Number of recent local backups to retain}
                            {--no-upload : Skip the Google Drive upload step}';
    protected $description = 'Dump the MySQL database to storage/app/backups and (optionally) upload to Google Drive.';

    public function __construct(protected GoogleDriveBackupService $drive)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $this->info('Starting database backup…');

        $tables = DB::select('SHOW TABLES');
        $dbKey  = 'Tables_in_' . config('database.connections.mysql.database');
        $tableNames = array_map(fn($t) => $t->$dbKey, $tables);

        $sql = "-- Adepa Pork Hub backup — " . now()->toDateTimeString() . "\n";
        $sql .= "SET FOREIGN_KEY_CHECKS=0;\n\n";

        foreach ($tableNames as $table) {
            $this->line("  · $table");

            // Schema
            $create = DB::select("SHOW CREATE TABLE `$table`");
            $sql .= "DROP TABLE IF EXISTS `$table`;\n";
            $sql .= $create[0]->{'Create Table'} . ";\n\n";

            // Data — chunked so we don't load 100k rows into memory.
            DB::table($table)->orderBy(DB::raw('1'))->chunk(500, function ($rows) use (&$sql, $table) {
                if ($rows->isEmpty()) return;
                $cols = array_keys((array) $rows->first());
                $colList = '`' . implode('`, `', $cols) . '`';

                $valueRows = $rows->map(function ($row) {
                    $vals = array_map(function ($v) {
                        if (is_null($v)) return 'NULL';
                        if (is_numeric($v)) return $v;
                        return "'" . addslashes((string) $v) . "'";
                    }, (array) $row);
                    return '(' . implode(',', $vals) . ')';
                })->implode(",\n");

                $sql .= "INSERT INTO `$table` ($colList) VALUES\n$valueRows;\n\n";
            });
        }

        $sql .= "SET FOREIGN_KEY_CHECKS=1;\n";

        // Write & gzip — capture timestamp ONCE so the file we write and
        // the path we upload from agree even if a second elapses.
        $compressed = gzencode($sql, 9);
        $timestamp  = now()->format('Y-m-d_His');
        $filename   = "backups/adepa-{$timestamp}.sql.gz";
        $disk       = Storage::disk('local');
        $disk->put($filename, $compressed);

        // Resolve the absolute path via the disk itself — Laravel 11's
        // default 'local' disk root is storage/app/private/, NOT
        // storage/app/. Computing storage_path('app/' . $filename)
        // would point at the wrong directory and the uploader would
        // log "local file missing".
        $absolutePath = $disk->path($filename);

        $size = round(strlen($compressed) / 1024, 1);
        $this->info("Wrote $filename (~{$size}KB)");

        // Off-site upload (Google Drive) — best effort. Local-only backup
        // still succeeds if Drive auth fails or isn't configured.
        if (! $this->option('no-upload')) {
            if ($this->drive->isConfigured()) {
                $remoteName = "adepa-{$timestamp}.sql.gz";
                $driveId = $this->drive->upload($absolutePath, $remoteName);
                if ($driveId) {
                    $this->info("  ↑ Uploaded to Google Drive (id: $driveId)");
                    $pruned = $this->drive->prune(
                        (int) config('services.google_drive.keep_days', 30)
                    );
                    if ($pruned > 0) {
                        $this->line("  - pruned $pruned old Drive backup(s)");
                    }
                } else {
                    $this->warn('  Drive upload failed — see laravel.log');
                }
            } else {
                $this->line('  Google Drive not configured — skipping off-site upload');
            }
        }

        // Prune local backups (keep small footprint on Hostinger's quota)
        $this->prune((int) $this->option('keep'));

        return self::SUCCESS;
    }

    protected function prune(int $keep): void
    {
        // Use the disk's actual root, not storage_path('app/...') — see
        // the Laravel 11 root-directory note in handle().
        $dir = Storage::disk('local')->path('backups');
        if (! File::isDirectory($dir)) return;

        $files = collect(File::files($dir))
            ->filter(fn($f) => str_ends_with($f->getFilename(), '.sql.gz'))
            ->sortByDesc(fn($f) => $f->getMTime())
            ->values();

        $files->slice($keep)->each(function ($f) {
            File::delete($f->getPathname());
            $this->line('  - removed ' . $f->getFilename());
        });
    }
}
