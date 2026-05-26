<?php

namespace App\Http\Controllers\Api\V1;

use App\Jobs\SendEventCancellationNotice;
use App\Models\EventRegistration;
use App\Models\PorkEvent;
use App\Services\PaystackService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Str;

class EventController extends Controller
{
    public function __construct(protected PaystackService $paystack) {}

    public function upcoming(): JsonResponse
    {
        return response()->json(['data' => PorkEvent::upcoming()->get()]);
    }

    public function index(): JsonResponse
    {
        return response()->json(PorkEvent::orderByDesc('event_date')->paginate(30));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->rules($request);
        $data['created_by'] = $request->user()->id;
        $event = PorkEvent::create($data);
        return response()->json($event, 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $event = PorkEvent::findOrFail($id);
        $event->update($this->rules($request, partial: true));
        return response()->json($event);
    }

    public function setStatus(Request $request, string $id): JsonResponse
    {
        $data = $request->validate(['status' => ['required', 'in:DRAFT,PUBLISHED,CANCELLED']]);
        $event = PorkEvent::findOrFail($id);
        $event->update(['status' => $data['status']]);
        return response()->json($event);
    }

    public function register(Request $request, string $id): JsonResponse
    {
        $event = PorkEvent::findOrFail($id);

        if ($event->status !== 'PUBLISHED') {
            return response()->json(['message' => 'Event is not open for registration.'], 422);
        }
        if ($event->registered_count >= $event->capacity) {
            return response()->json(['message' => 'Event is fully booked.'], 422);
        }

        $existing = EventRegistration::where('event_id', $event->id)
            ->where('customer_id', $request->user()->id)
            ->first();

        if ($existing) {
            return response()->json($existing);
        }

        $reference = 'EVT-' . strtoupper(Str::random(10));

        $registration = EventRegistration::create([
            'event_id'           => $event->id,
            'customer_id'        => $request->user()->id,
            'payment_status'     => 'PENDING',
            'paystack_reference' => $reference,
        ]);

        return response()->json([
            'registration' => $registration,
            'paystack' => [
                'reference' => $reference,
                'amount'    => $event->flat_rate_kobo,
            ],
        ], 201);
    }

    public function myRegistrations(Request $request): JsonResponse
    {
        $regs = EventRegistration::with('event')
            ->where('customer_id', $request->user()->id)
            ->orderByDesc('created_at')->get();
        return response()->json(['data' => $regs]);
    }

    public function registrations(string $id): JsonResponse
    {
        $regs = EventRegistration::with('customer:id,name,phone,email')
            ->where('event_id', $id)
            ->orderBy('created_at')
            ->get();
        return response()->json(['data' => $regs]);
    }

    public function checkin(string $eventId, string $regId): JsonResponse
    {
        $reg = EventRegistration::where('event_id', $eventId)->findOrFail($regId);
        $reg->update([
            'checked_in'    => ! $reg->checked_in,
            'checked_in_at' => $reg->checked_in ? null : now(),
        ]);
        return response()->json($reg);
    }

    public function cancel(string $id): JsonResponse
    {
        $event = PorkEvent::findOrFail($id);
        $event->update(['status' => 'CANCELLED']);
        SendEventCancellationNotice::dispatch($event->id);
        return response()->json(['message' => 'Event cancelled; notifications queued.']);
    }

    protected function rules(Request $request, bool $partial = false): array
    {
        $rule = $partial ? 'sometimes' : 'required';
        return $request->validate([
            'name'           => [$rule, 'string', 'max:255'],
            'event_date'     => [$rule, 'date'],
            'event_time'     => [$rule, 'date_format:H:i,H:i:s'],
            'venue_name'     => [$rule, 'string'],
            'venue_address'  => [$rule, 'string'],
            'flat_rate_kobo' => [$rule, 'integer', 'min:0'],
            'capacity'       => [$rule, 'integer', 'min:1'],
            'description'    => [$rule, 'string'],
            'image_url'      => ['nullable', 'url'],
            'status'         => ['nullable', 'in:DRAFT,PUBLISHED,CANCELLED'],
        ]);
    }
}
