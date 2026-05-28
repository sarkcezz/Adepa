<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Blocks API requests from users with force_password_change=true until
 * they actually change their password.
 *
 * Allowed endpoints while flagged (so the user can complete the change
 * and read their own user record):
 *  - POST /auth/change-password
 *  - POST /auth/logout
 *  - GET  /auth/me
 *
 * The front-end already routes users to a change-password screen — this
 * is the server-side enforcement that ensures even a direct API call
 * with the user's token can't do anything else.
 */
class EnsurePasswordChanged
{
    /**
     * Paths (relative to /api/v1/) that bypass this gate.
     */
    protected array $allowed = [
        'auth/change-password',
        'auth/logout',
        'auth/me',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->force_password_change) {
            // Strip the /api/v1/ prefix when comparing — Laravel's request
            // path() drops the leading slash but keeps the prefix.
            $path = ltrim($request->path(), '/');
            $relative = preg_replace('#^api/v1/#', '', $path);

            if (! in_array($relative, $this->allowed, true)) {
                return response()->json([
                    'message'                  => 'You must change your temporary password before continuing.',
                    'force_password_change'    => true,
                    'change_password_endpoint' => 'POST /api/v1/auth/change-password',
                ], 423); // 423 Locked — "the resource that is being accessed is locked"
            }
        }

        return $next($request);
    }
}
