<?php

namespace App\Console\Commands;

use App\Mail\LowStockAlertMail;
use App\Models\Product;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

/**
 * Daily check — finds products whose stock_qty is below the threshold
 * and emails the admin a one-pager listing them. Runs at 08:00.
 *
 * Threshold can be overridden per-run: `php artisan adepa:low-stock --threshold=10`
 */
class SendLowStockAlert extends Command
{
    protected $signature = 'adepa:low-stock {--threshold=5 : Stock level to alert under}';
    protected $description = 'Email the admin a list of products running low on stock.';

    public function handle(): int
    {
        $threshold = (int) $this->option('threshold');

        $lows = Product::where('is_active', true)
            ->where('stock_qty', '<', $threshold)
            ->orderBy('stock_qty')
            ->get();

        if ($lows->isEmpty()) {
            $this->info('All products well stocked. No alert sent.');
            return self::SUCCESS;
        }

        $recipients = User::where('role', 'admin')->where('is_active', true)->pluck('email')->filter()->values();
        if ($recipients->isEmpty()) {
            $this->warn('No active admin email — skipping.');
            return self::SUCCESS;
        }

        Mail::to($recipients->all())->queue(new LowStockAlertMail($lows, $threshold));

        $this->info("Queued low-stock alert for {$lows->count()} product(s) to {$recipients->count()} admin(s).");
        return self::SUCCESS;
    }
}
