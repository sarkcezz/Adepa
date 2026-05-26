<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Campaign;
use App\Services\CampaignService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class CampaignController extends Controller
{
    public function __construct(protected CampaignService $service) {}

    public function index(): JsonResponse
    {
        return response()->json(Campaign::orderByDesc('valid_to')->paginate(30));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->rules($request);
        $campaign = Campaign::create($data);
        return response()->json($campaign, 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $campaign = Campaign::findOrFail($id);
        $campaign->update($this->rules($request, partial: true));
        return response()->json($campaign);
    }

    public function toggle(string $id): JsonResponse
    {
        $campaign = Campaign::findOrFail($id);
        $campaign->update(['is_active' => ! $campaign->is_active]);
        return response()->json($campaign);
    }

    public function validateCode(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code'          => ['required', 'string'],
            'subtotal_kobo' => ['required', 'integer', 'min:1'],
            'product_lines' => ['nullable', 'array'],
        ]);

        $result = $this->service->validate($data['code'], $data['subtotal_kobo'], $data['product_lines'] ?? null);
        return response()->json($result);
    }

    protected function rules(Request $request, bool $partial = false): array
    {
        $rule = $partial ? 'sometimes' : 'required';
        return $request->validate([
            'name'           => [$rule, 'string'],
            'code'           => [$rule, 'string', 'max:50'],
            'discount_type'  => [$rule, 'in:PERCENT,FIXED,FREE_DELIVERY'],
            'discount_value' => [$rule, 'integer', 'min:0'],
            'min_order_kobo' => ['nullable', 'integer', 'min:0'],
            'max_usage'      => ['nullable', 'integer', 'min:1'],
            'valid_from'     => [$rule, 'date'],
            'valid_to'       => [$rule, 'date', 'after:valid_from'],
            'applicable_lines' => ['nullable', 'array'],
            'is_active'      => ['nullable', 'boolean'],
        ]);
    }
}
