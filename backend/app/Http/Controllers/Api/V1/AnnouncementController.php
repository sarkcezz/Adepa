<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\StandAnnouncement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class AnnouncementController extends Controller
{
    public function active(): JsonResponse
    {
        $list = StandAnnouncement::active()->orderByDesc('start_date')->get();
        return response()->json(['data' => $list]);
    }

    public function index(): JsonResponse
    {
        return response()->json(StandAnnouncement::orderByDesc('start_date')->paginate(30));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->rules($request);
        $data['created_by'] = $request->user()->id;
        $a = StandAnnouncement::create($data);
        return response()->json($a, 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $a = StandAnnouncement::findOrFail($id);
        $a->update($this->rules($request, partial: true));
        return response()->json($a);
    }

    public function toggle(string $id): JsonResponse
    {
        $a = StandAnnouncement::findOrFail($id);
        $a->update(['is_published' => ! $a->is_published]);
        return response()->json($a);
    }

    public function destroy(string $id): JsonResponse
    {
        StandAnnouncement::findOrFail($id)->delete();
        return response()->json(['message' => 'Deleted.']);
    }

    protected function rules(Request $request, bool $partial = false): array
    {
        $rule = $partial ? 'sometimes' : 'required';
        return $request->validate([
            'title'        => [$rule, 'string', 'max:255'],
            'description'  => [$rule, 'string'],
            'locations'    => [$rule, 'array', 'min:1'],
            'locations.*.name'  => ['required', 'string'],
            'locations.*.area'  => ['required', 'string'],
            'locations.*.days'  => ['required', 'string'],
            'locations.*.hours' => ['required', 'string'],
            'locations.*.map_link' => ['nullable', 'string'],
            'start_date'   => [$rule, 'date'],
            'end_date'     => [$rule, 'date', 'after_or_equal:start_date'],
            'is_published' => ['nullable', 'boolean'],
        ]);
    }
}
