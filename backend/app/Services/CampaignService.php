<?php

namespace App\Services;

use App\Models\Campaign;

class CampaignService
{
    public function validate(string $code, int $subtotalKobo, ?array $productLines = null): array
    {
        $campaign = Campaign::where('code', $code)->where('is_active', true)->first();

        if (! $campaign) {
            return ['valid' => false, 'message' => 'Promo code not found.'];
        }

        $now = now();
        if ($now->lt($campaign->valid_from) || $now->gt($campaign->valid_to)) {
            return ['valid' => false, 'message' => 'Promo code expired or not yet active.'];
        }

        if ($campaign->max_usage && $campaign->usage_count >= $campaign->max_usage) {
            return ['valid' => false, 'message' => 'Promo code has reached its usage limit.'];
        }

        if ($subtotalKobo < $campaign->min_order_kobo) {
            return [
                'valid'   => false,
                'message' => 'Minimum order is GHS ' . number_format($campaign->min_order_kobo / 100, 2),
            ];
        }

        if (! empty($campaign->applicable_lines) && $productLines) {
            $matches = array_intersect($campaign->applicable_lines, $productLines);
            if (! count($matches)) {
                return ['valid' => false, 'message' => 'Promo not applicable to selected products.'];
            }
        }

        $discountKobo = $this->discountKobo($campaign, $subtotalKobo);

        return [
            'valid'         => true,
            'campaign'      => $campaign,
            'campaign_id'   => $campaign->id,
            'discount_kobo' => $discountKobo,
            'free_delivery' => $campaign->discount_type === 'FREE_DELIVERY',
            'message'       => 'Promo applied.',
        ];
    }

    public function discountKobo(Campaign $campaign, int $subtotalKobo): int
    {
        return match ($campaign->discount_type) {
            'PERCENT'       => (int) round($subtotalKobo * ($campaign->discount_value / 100)),
            'FIXED'         => min($campaign->discount_value, $subtotalKobo),
            'FREE_DELIVERY' => 0,
        };
    }
}
