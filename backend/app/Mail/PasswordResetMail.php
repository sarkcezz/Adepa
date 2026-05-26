<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PasswordResetMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public string $resetUrl;
    public string $recipientName;
    public int $expiresInMinutes;

    public function __construct(string $resetUrl, ?string $recipientName, int $expiresInMinutes = 60)
    {
        $this->resetUrl         = $resetUrl;
        $this->recipientName    = $recipientName ?: 'there';
        $this->expiresInMinutes = $expiresInMinutes;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Reset your Adepa Pork Hub password',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.password-reset',
            text: 'emails.password-reset-plain',
            with: [
                'resetUrl'         => $this->resetUrl,
                'recipientName'    => $this->recipientName,
                'expiresInMinutes' => $this->expiresInMinutes,
            ],
        );
    }
}
