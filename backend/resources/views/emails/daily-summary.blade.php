<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Daily summary</title>
</head>
@php
  $fmt = fn($k) => 'GHS ' . number_format($k / 100, 2);
  $delta = $today['revenue_kobo'] - $yesterday['revenue_kobo'];
  $deltaPct = $yesterday['revenue_kobo'] > 0
    ? round(($delta / $yesterday['revenue_kobo']) * 100)
    : null;
@endphp
<body style="margin:0;background:#F6F2EA;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#1A1815;">
  <div style="max-width:600px;margin:0 auto;padding:24px;">
    <div style="background:linear-gradient(135deg,#292420,#1A1815);color:#fff;padding:24px;border-radius:12px 12px 0 0;">
      <p style="margin:0;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#B08D3C;font-weight:600;">Daily summary</p>
      <h1 style="margin:6px 0 0;font-size:24px;font-family:'Playfair Display',Georgia,serif;">
        {{ $date->format('l, j F Y') }}
      </h1>
    </div>

    <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;">
      {{-- Revenue + sales count cards --}}
      <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0 8px;">
        <tr>
          <td width="50%" style="padding-right:6px;">
            <div style="background:#F6F2EA;padding:16px;border-radius:10px;">
              <p style="margin:0;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#737373;font-weight:600;">Revenue today</p>
              <p style="margin:6px 0 0;font-size:24px;font-weight:800;color:#8E2A2B;font-family:'Playfair Display',Georgia,serif;">{{ $fmt($today['revenue_kobo']) }}</p>
              @if($deltaPct !== null)
                <p style="margin:4px 0 0;font-size:11px;color:{{ $deltaPct >= 0 ? '#15803d' : '#b91c1c' }};">
                  {{ $deltaPct >= 0 ? '▲' : '▼' }} {{ abs($deltaPct) }}% vs. yesterday
                </p>
              @endif
            </div>
          </td>
          <td width="50%" style="padding-left:6px;">
            <div style="background:#F6F2EA;padding:16px;border-radius:10px;">
              <p style="margin:0;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#737373;font-weight:600;">Orders today</p>
              <p style="margin:6px 0 0;font-size:24px;font-weight:800;color:#1A1815;font-family:'Playfair Display',Georgia,serif;">{{ $today['sales_count'] }}</p>
              <p style="margin:4px 0 0;font-size:11px;color:#737373;">
                avg {{ $fmt($today['avg_order_kobo']) }}
              </p>
            </div>
          </td>
        </tr>
      </table>

      {{-- Top products --}}
      @if($topProducts->isNotEmpty())
        <h2 style="margin:24px 0 8px;font-size:16px;font-family:'Playfair Display',Georgia,serif;">Top products</h2>
        <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:14px;">
          @foreach($topProducts as $i => $p)
            <tr style="border-bottom:1px solid #F5F5F5;">
              <td width="30" style="padding:8px 0;color:#737373;font-size:12px;">{{ $i + 1 }}.</td>
              <td style="padding:8px 0;"><strong>{{ $p->product_name }}</strong></td>
              <td align="right" style="padding:8px 0;color:#525252;font-size:12px;">{{ $p->qty }} sold</td>
              <td align="right" width="80" style="padding:8px 0;color:#8E2A2B;font-weight:600;">{{ $fmt($p->revenue_kobo) }}</td>
            </tr>
          @endforeach
        </table>
      @endif

      {{-- Top employees --}}
      @if($topEmployees->isNotEmpty())
        <h2 style="margin:24px 0 8px;font-size:16px;font-family:'Playfair Display',Georgia,serif;">Top employees</h2>
        <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:14px;">
          @foreach($topEmployees as $i => $e)
            <tr style="border-bottom:1px solid #F5F5F5;">
              <td width="30" style="padding:8px 0;color:#737373;font-size:12px;">{{ $i + 1 }}.</td>
              <td style="padding:8px 0;">
                <strong>{{ $e->name }}</strong>
                <span style="color:#737373;font-size:11px;font-family:monospace;"> · {{ $e->employee_id }}</span>
              </td>
              <td align="right" style="padding:8px 0;color:#525252;font-size:12px;">{{ $e->orders }} sales</td>
              <td align="right" width="80" style="padding:8px 0;color:#8E2A2B;font-weight:600;">{{ $fmt($e->revenue_kobo) }}</td>
            </tr>
          @endforeach
        </table>
      @endif

      {{-- Operational health --}}
      <h2 style="margin:24px 0 8px;font-size:16px;font-family:'Playfair Display',Georgia,serif;">Things to look at</h2>
      <ul style="margin:0;padding-left:20px;font-size:14px;line-height:1.6;color:#525252;">
        @if($lowStockCount > 0)
          <li><strong>{{ $lowStockCount }}</strong> product{{ $lowStockCount === 1 ? '' : 's' }} below 5 units in stock</li>
        @endif
        @if($pendingCount > 0)
          <li><strong>{{ $pendingCount }}</strong> order{{ $pendingCount === 1 ? '' : 's' }} still pending</li>
        @endif
        @if($lowStockCount === 0 && $pendingCount === 0)
          <li style="color:#15803d;">✓ All clear — no pending orders, all products well stocked.</li>
        @endif
      </ul>

      <div style="margin-top:24px;padding-top:16px;border-top:1px solid #E5E5E5;text-align:center;">
        <a href="{{ rtrim(env('FRONTEND_URL'), '/') }}/admin"
           style="display:inline-block;background:#8E2A2B;color:#fff;padding:10px 20px;border-radius:999px;text-decoration:none;font-weight:600;font-size:13px;">
          Open admin dashboard
        </a>
      </div>
    </div>

    <p style="text-align:center;margin:16px 0 0;font-size:11px;color:#737373;">
      Adepa Pork Hub — sent automatically at end of day.
    </p>
  </div>
</body>
</html>
