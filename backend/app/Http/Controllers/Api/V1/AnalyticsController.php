<?php

namespace App\Http\Controllers\Api\V1;

use App\Services\AnalyticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class AnalyticsController extends Controller
{
    public function __construct(protected AnalyticsService $svc) {}

    public function summary(): JsonResponse
    {
        return response()->json($this->svc->summary());
    }

    public function revenue(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->svc->revenue(
                period: $request->input('period', 'daily'),
                from: $request->input('from'),
                to: $request->input('to'),
            ),
        ]);
    }

    public function products(): JsonResponse
    {
        return response()->json(['data' => $this->svc->topProducts(10)]);
    }

    public function employees(): JsonResponse
    {
        return response()->json(['data' => $this->svc->employeePerformance()]);
    }

    public function campaigns(): JsonResponse
    {
        return response()->json(['data' => $this->svc->campaignPerformance()]);
    }

    public function customers(): JsonResponse
    {
        return response()->json(['data' => $this->svc->topCustomers(10)]);
    }
}
