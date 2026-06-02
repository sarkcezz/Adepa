<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset your Adepa Pork Hub password</title>
</head>
<body style="margin:0; padding:0; background-color:#F6F2EA; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; color:#1A1815;">
    <!-- Hidden preheader text — appears in inbox previews -->
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; visibility:hidden; mso-hide:all;">
        Use this link to reset your password. It expires in {{ $expiresInMinutes }} minutes.
    </div>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#F6F2EA;">
        <tr>
            <td align="center" style="padding:32px 16px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:560px; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.04);">

                    <!-- Header (brand bar) -->
                    <tr>
                        <td style="background:linear-gradient(135deg,#8E2A2B 0%,#5C1A1B 100%); padding:32px 32px 24px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td style="background:#ffffff; width:44px; height:44px; border-radius:10px; text-align:center; vertical-align:middle; font-family:'Georgia',serif; font-size:24px; font-weight:bold; color:#8E2A2B;">A</td>
                                    <td style="padding-left:14px;">
                                        <div style="color:#ffffff; font-size:18px; font-weight:bold; line-height:1;">Adepa Pork Hub</div>
                                        <div style="color:rgba(255,255,255,0.75); font-size:12px; margin-top:4px;">Fresh. Spiced. Ready for Every Meal.</div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding:32px;">
                            <h1 style="margin:0 0 16px; font-size:22px; font-weight:bold; color:#1A1815;">Reset your password</h1>

                            <p style="margin:0 0 16px; font-size:15px; line-height:1.6; color:#404040;">
                                Hi {{ $recipientName }},
                            </p>

                            <p style="margin:0 0 16px; font-size:15px; line-height:1.6; color:#404040;">
                                We received a request to reset the password on your Adepa Pork Hub account. Click the button below to choose a new one.
                            </p>

                            <!-- CTA -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0;">
                                <tr>
                                    <td align="center" style="background:#8E2A2B; border-radius:10px;">
                                        <a href="{{ $resetUrl }}"
                                           style="display:inline-block; padding:14px 28px; font-size:15px; font-weight:bold; color:#ffffff; text-decoration:none; border-radius:10px;">
                                            Reset password
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin:0 0 8px; font-size:13px; line-height:1.5; color:#737373;">
                                Or copy &amp; paste this URL into your browser:
                            </p>
                            <p style="margin:0 0 24px; font-size:13px; line-height:1.5; word-break:break-all;">
                                <a href="{{ $resetUrl }}" style="color:#8E2A2B; text-decoration:underline;">{{ $resetUrl }}</a>
                            </p>

                            <!-- Security note -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#F6F2EA; border-radius:10px; margin-top:8px;">
                                <tr>
                                    <td style="padding:16px;">
                                        <p style="margin:0; font-size:13px; line-height:1.5; color:#525252;">
                                            <strong style="color:#1A1815;">⏱ Link expires in {{ $expiresInMinutes }} minutes.</strong>
                                            If you didn't request a password reset, you can safely ignore this email — your password won't change.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding:24px 32px; background:#F6F2EA; text-align:center;">
                            <p style="margin:0 0 6px; font-size:12px; color:#737373;">
                                Need help? Reply to this email or message us on
                                <a href="https://wa.me/233500000000" style="color:#8E2A2B; text-decoration:none;">WhatsApp</a>.
                            </p>
                            <p style="margin:0; font-size:11px; color:#A3A3A3;">
                                © {{ date('Y') }} Adepa Pork Hub • Accra, Ghana
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
