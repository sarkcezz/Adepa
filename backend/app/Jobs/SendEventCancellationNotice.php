<?php

namespace App\Jobs;

use App\Models\EventRegistration;
use App\Models\PorkEvent;
use App\Services\HubtelSmsService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendEventCancellationNotice implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 60;

    public function __construct(public string $eventId) {}

    public function handle(HubtelSmsService $sms): void
    {
        $event = PorkEvent::find($this->eventId);
        if (! $event) return;

        $registrations = EventRegistration::with('customer')
            ->where('event_id', $event->id)
            ->where('payment_status', 'PAID')
            ->get();

        foreach ($registrations as $reg) {
            if (! $reg->customer) continue;

            $msg = "Adepa Pork Hub: Unfortunately the event '{$event->name}' has been cancelled. Refund will be processed within 3 working days.";

            if ($reg->customer->phone) {
                $sms->send($reg->customer->phone, $msg);
            }
            if ($reg->customer->email) {
                try {
                    Mail::raw($msg, fn($m) => $m->to($reg->customer->email)->subject('Event cancelled — refund coming'));
                } catch (\Throwable $e) {
                    Log::warning('Cancellation email failed', ['e' => $e->getMessage()]);
                }
            }
        }
    }
}
