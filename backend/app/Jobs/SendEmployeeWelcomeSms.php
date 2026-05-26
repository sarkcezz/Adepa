<?php

namespace App\Jobs;

use App\Models\User;
use App\Services\HubtelSmsService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendEmployeeWelcomeSms implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 60;

    public function __construct(public string $userId, public string $tempPassword) {}

    public function handle(HubtelSmsService $sms): void
    {
        $emp = User::find($this->userId);
        if (! $emp || ! $emp->phone) return;

        $msg = "Welcome to Adepa Pork Hub. Your Employee ID is {$emp->employee_id} and temporary password is {$this->tempPassword}. Please change it on first login.";
        $sms->send($emp->phone, $msg);
    }
}
