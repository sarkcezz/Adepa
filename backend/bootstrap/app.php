<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        // /up returns 200 OK + JSON status if the framework is responsive.
        // Wire UptimeRobot or BetterStack to ping this every 5 min.
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // No statefulApi() — we use Bearer-token auth, not SPA cookies.
        // statefulApi() enables session/CSRF for /api/* which breaks
        // cross-subdomain login (frontend on shop, API on api.shop).
        $middleware->alias([
            'role'                 => \App\Http\Middleware\RoleMiddleware::class,
            'password.changed'     => \App\Http\Middleware\EnsurePasswordChanged::class,
        ]);
        // Exclude every API endpoint from CSRF — they authenticate via
        // Authorization: Bearer header, which doesn't need a token.
        $middleware->validateCsrfTokens(except: [
            'api/*',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (\Illuminate\Validation\ValidationException $e, $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'message' => $e->getMessage(),
                    'errors'  => $e->errors(),
                ], 422);
            }
        });

        $exceptions->render(function (\Symfony\Component\HttpKernel\Exception\HttpException $e, $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'message' => $e->getMessage() ?: 'Request failed.',
                ], $e->getStatusCode());
            }
        });

        $exceptions->render(function (\Throwable $e, $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'message' => app()->isProduction() ? 'Server error.' : $e->getMessage(),
                ], 500);
            }
        });
    })->create();
