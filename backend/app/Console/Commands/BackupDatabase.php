<?php

namespace App\Console\Commands;

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
    protected $signature = 'adepa:backup {--keep=7 : Number of recent backups to retain}';
    protected $description = 'Dump the MySQL database to a compressed file in storage/app/backups.';

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

        // Write & gzip
        $filename = 'backups/adepa-' . now()->format('Y-m-d_His') . '.sql.gz';
        Storage::disk('local')->put($filename, gzencode($sql, 9));

        $size = round(strlen(gzencode($sql, 9)) / 1024, 1);
        $this->info("Wrote $filename (~{$size}KB)");

        // Prune old backups
        $this->prune((int) $this->option('keep'));

        return self::SUCCESS;
    }

    protected function prune(int $keep): void
    {
        $dir = storage_path('app/backups');
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
