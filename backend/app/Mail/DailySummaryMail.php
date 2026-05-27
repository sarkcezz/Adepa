<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class DailySummaryMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public Carbon $date,
        public array $today,
        public array $yesterday,
        public Collection $topProducts,
        public Collection $topEmployees,
        public int $lowStockCount,
        public int $pendingCount,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '[Adepa] Daily summary — ' . $this->date->format('D, j M Y'),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.daily-summary',
            text: 'emails.daily-summary-plain',
            with: [
                'date'          => $this->date,
                'today'         => $this->today,
                'yesterday'     => $this->yesterday,
                'topProducts'   => $this->topProducts,
                'topEmployees'  => $this->topEmployees,
                'lowStockCount' => $this->lowStockCount,
                'pendingCount'  => $this->pendingCount,
            ],
        );
    }
}
