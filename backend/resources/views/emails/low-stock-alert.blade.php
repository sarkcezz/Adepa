<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Low-stock alert</title>
</head>
<body style="margin:0;background:#FAF6EE;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#1A1A1A;">
  <div style="max-width:600px;margin:0 auto;padding:24px;">
    <div style="background:#C0281A;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0;">
      <p style="margin:0;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#D4920A;font-weight:600;">Inventory alert</p>
      <h1 style="margin:6px 0 0;font-size:24px;font-family:'Playfair Display',Georgia,serif;">{{ $products->count() }} product{{ $products->count() === 1 ? '' : 's' }} running low</h1>
    </div>

    <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;">
      <p style="margin:0 0 16px;font-size:14px;color:#525252;">
        These products are at or below the threshold of <strong>{{ $threshold }}</strong> units.
        Restock soon to avoid out-of-stock at the stand or online.
      </p>

      <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="border-bottom:2px solid #E5E5E5;">
            <th align="left"  style="padding:8px 0;font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:#525252;">Product</th>
            <th align="left"  style="padding:8px 0;font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:#525252;">Line</th>
            <th align="right" style="padding:8px 0;font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:#525252;">Stock</th>
          </tr>
        </thead>
        <tbody>
          @foreach($products as $p)
            <tr style="border-bottom:1px solid #F5F5F5;">
              <td style="padding:10px 0;">
                <strong>{{ $p->name }}</strong>
                @if($p->weight_grams)
                  <div style="font-size:11px;color:#737373;">{{ $p->weight_grams }}g</div>
                @endif
              </td>
              <td style="padding:10px 0;color:#525252;">{{ $p->product_line }}</td>
              <td align="right" style="padding:10px 0;">
                <span style="background:{{ $p->stock_qty === 0 ? '#FCEAE7;color:#7F1B11' : '#FBEFD2;color:#7C5506' }};padding:3px 10px;border-radius:999px;font-weight:700;font-size:13px;">
                  {{ $p->stock_qty }}
                </span>
              </td>
            </tr>
          @endforeach
        </tbody>
      </table>

      <div style="margin-top:20px;padding-top:16px;border-top:1px solid #E5E5E5;">
        <a href="{{ rtrim(env('FRONTEND_URL'), '/') }}/admin/products"
           style="display:inline-block;background:#C0281A;color:#fff;padding:10px 20px;border-radius:999px;text-decoration:none;font-weight:600;font-size:13px;">
          Open products in admin →
        </a>
      </div>
    </div>

    <p style="text-align:center;margin:16px 0 0;font-size:11px;color:#737373;">
      You're receiving this because you're an admin on Adepa Pork Hub.
    </p>
  </div>
</body>
</html>
