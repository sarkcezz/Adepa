Adepa Pork Hub — Daily summary
{{ $date->format('l, j F Y') }}
=====================================

Today
  Revenue: GHS {{ number_format($today['revenue_kobo'] / 100, 2) }}
  Orders : {{ $today['sales_count'] }}
  Avg    : GHS {{ number_format($today['avg_order_kobo'] / 100, 2) }}

Yesterday
  Revenue: GHS {{ number_format($yesterday['revenue_kobo'] / 100, 2) }}
  Orders : {{ $yesterday['sales_count'] }}

@if($topProducts->isNotEmpty())
Top products today:
@foreach($topProducts as $i => $p)
  {{ $i + 1 }}. {{ $p->product_name }} — {{ $p->qty }} units, GHS {{ number_format($p->revenue_kobo / 100, 2) }}
@endforeach
@endif

@if($topEmployees->isNotEmpty())
Top employees today:
@foreach($topEmployees as $i => $e)
  {{ $i + 1 }}. {{ $e->name }} ({{ $e->employee_id }}) — {{ $e->orders }} sales, GHS {{ number_format($e->revenue_kobo / 100, 2) }}
@endforeach
@endif

Heads-up
  Low-stock products: {{ $lowStockCount }}
  Pending orders   : {{ $pendingCount }}

Open admin: {{ rtrim(env('FRONTEND_URL'), '/') }}/admin
