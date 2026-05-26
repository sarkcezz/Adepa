<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = Product::query();

        if ($request->boolean('active_only', true)) {
            $q->where('is_active', true);
        }
        if ($line = $request->input('line')) {
            $q->where('product_line', $line);
        }
        if ($variant = $request->input('variant')) {
            $q->where('variant', $variant);
        }
        if ($request->filled('min_heat')) {
            $q->where('heat_level', '>=', (int) $request->min_heat);
        }
        if ($request->filled('max_heat')) {
            $q->where('heat_level', '<=', (int) $request->max_heat);
        }

        $products = $q->orderBy('product_line')->orderBy('weight_grams')->get();

        return response()->json(['data' => $products]);
    }

    public function show(string $id): JsonResponse
    {
        $product = Product::findOrFail($id);
        return response()->json($product);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'         => ['required', 'string'],
            'product_line' => ['required', 'in:RAW,SPICED,READY_TO_EAT'],
            'variant'      => ['required', 'in:PLAIN,MILD,SPICY,NONE'],
            'weight_grams' => ['nullable', 'integer', 'min:1'],
            'price_kobo'   => ['required', 'integer', 'min:0'],
            'description'  => ['required', 'string'],
            'ingredients'  => ['nullable', 'string'],
            'storage_instructions' => ['nullable', 'string'],
            'heat_level'   => ['nullable', 'integer', 'min:0', 'max:5'],
            'image_url'    => ['nullable', 'url'],
            'stock_qty'    => ['nullable', 'integer', 'min:0'],
            'is_active'    => ['nullable', 'boolean'],
        ]);

        $product = Product::create($data);
        return response()->json($product, 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $product = Product::findOrFail($id);

        $data = $request->validate([
            'name'         => ['sometimes', 'string'],
            'product_line' => ['sometimes', 'in:RAW,SPICED,READY_TO_EAT'],
            'variant'      => ['sometimes', 'in:PLAIN,MILD,SPICY,NONE'],
            'weight_grams' => ['nullable', 'integer', 'min:1'],
            'price_kobo'   => ['sometimes', 'integer', 'min:0'],
            'description'  => ['sometimes', 'string'],
            'ingredients'  => ['nullable', 'string'],
            'storage_instructions' => ['nullable', 'string'],
            'heat_level'   => ['nullable', 'integer', 'min:0', 'max:5'],
            'image_url'    => ['nullable', 'url'],
            'stock_qty'    => ['nullable', 'integer', 'min:0'],
            'is_active'    => ['nullable', 'boolean'],
        ]);

        $product->update($data);
        return response()->json($product);
    }

    public function toggle(string $id): JsonResponse
    {
        $product = Product::findOrFail($id);
        $product->update(['is_active' => ! $product->is_active]);
        return response()->json($product);
    }

    public function bulkPrice(Request $request): JsonResponse
    {
        $data = $request->validate([
            'product_line' => ['required', 'in:RAW,SPICED,READY_TO_EAT'],
            'variant'      => ['nullable', 'in:PLAIN,MILD,SPICY,NONE'],
            'mode'         => ['required', 'in:PERCENT,FIXED'],
            'value'        => ['required', 'numeric'],
        ]);

        $q = Product::where('product_line', $data['product_line']);
        if (! empty($data['variant'])) {
            $q->where('variant', $data['variant']);
        }

        $products = $q->get();
        foreach ($products as $p) {
            $new = $data['mode'] === 'PERCENT'
                ? (int) round($p->price_kobo * (1 + ($data['value'] / 100)))
                : (int) max(0, $p->price_kobo + ($data['value'] * 100));
            $p->update(['price_kobo' => $new]);
        }

        return response()->json(['updated' => $products->count()]);
    }
}
