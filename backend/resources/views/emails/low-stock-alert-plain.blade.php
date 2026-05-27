Adepa Pork Hub — Low-stock alert

{{ $products->count() }} product(s) are at or below {{ $threshold }} units in stock:

@foreach($products as $p)
- {{ $p->name }} @if($p->weight_grams)({{ $p->weight_grams }}g) @endif — {{ $p->stock_qty }} left
@endforeach

Restock from the admin panel:
{{ rtrim(env('FRONTEND_URL'), '/') }}/admin/products
