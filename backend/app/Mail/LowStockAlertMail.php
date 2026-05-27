<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Collection;

class LowStockAlertMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public Collection $products,
        public int $threshold,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '[Adepa] Low-stock alert: ' . $this->products->count() . ' product(s) running low',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.low-stock-alert',
            text: 'emails.low-stock-alert-plain',
            with: [
                'products'  => $this->products,
                'threshold' => $this->threshold,
            ],
        );
    }
}
