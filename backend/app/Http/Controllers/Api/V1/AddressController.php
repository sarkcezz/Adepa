<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Address;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class AddressController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json(Address::where('user_id', $request->user()->id)->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->rules($request);

        $count = Address::where('user_id', $request->user()->id)->count();
        if ($count >= 3) {
            return response()->json(['message' => 'Maximum 3 addresses allowed.'], 422);
        }

        $data['user_id'] = $request->user()->id;

        if ($data['is_default'] ?? false) {
            Address::where('user_id', $request->user()->id)->update(['is_default' => false]);
        }

        $address = Address::create($data);
        return response()->json($address, 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $address = Address::where('user_id', $request->user()->id)->findOrFail($id);
        $data = $this->rules($request, partial: true);

        if ($data['is_default'] ?? false) {
            Address::where('user_id', $request->user()->id)->update(['is_default' => false]);
        }

        $address->update($data);
        return response()->json($address);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $address = Address::where('user_id', $request->user()->id)->findOrFail($id);
        $address->delete();
        return response()->json(['message' => 'Deleted.']);
    }

    protected function rules(Request $request, bool $partial = false): array
    {
        $rule = $partial ? 'sometimes' : 'required';
        return $request->validate([
            'label'      => [$rule, 'string', 'max:50'],
            'recipient'  => [$rule, 'string', 'max:255'],
            'phone'      => [$rule, 'string', 'max:20'],
            'area'       => [$rule, 'string', 'max:255'],
            'district'   => [$rule, 'string', 'max:255'],
            'landmark'   => ['nullable', 'string'],
            'is_default' => ['nullable', 'boolean'],
        ]);
    }
}
