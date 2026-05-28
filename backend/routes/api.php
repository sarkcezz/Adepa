<?php

use App\Http\Controllers\Api\V1\AddressController;
use App\Http\Controllers\Api\V1\AnalyticsController;
use App\Http\Controllers\Api\V1\AnnouncementController;
use App\Http\Controllers\Api\V1\AuditLogController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CampaignController;
use App\Http\Controllers\Api\V1\CustomerController;
use App\Http\Controllers\Api\V1\EmployeeController;
use App\Http\Controllers\Api\V1\EventController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\OrderController;
use App\Http\Controllers\Api\V1\PaymentController;
use App\Http\Controllers\Api\V1\ProductController;
use App\Http\Controllers\Api\V1\UploadController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    // ─── PUBLIC ──────────────────────────────────────────────
    Route::middleware('throttle:auth')->group(function () {
        Route::post('auth/register',          [AuthController::class, 'register']);
        Route::post('auth/login',             [AuthController::class, 'login']);
        Route::post('auth/employee/login',    [AuthController::class, 'employeeLogin']);
        Route::post('auth/forgot-password',   [AuthController::class, 'forgotPassword']);
        Route::post('auth/reset-password',    [AuthController::class, 'resetPassword']);
    });

    Route::get('products',                    [ProductController::class, 'index']);
    Route::get('products/{id}',               [ProductController::class, 'show']);
    Route::get('announcements/active',        [AnnouncementController::class, 'active']);
    Route::get('events/upcoming',             [EventController::class, 'upcoming']);
    Route::post('campaigns/validate',         [CampaignController::class, 'validateCode']);
    Route::post('payments/webhook',           [PaymentController::class, 'webhook']);

    // ─── AUTHENTICATED (any role) ────────────────────────────
    // password.changed blocks all routes except /auth/{me,logout,change-password}
    // when the logged-in user has force_password_change=true. This is the
    // server-side counterpart to the React force-change interstitial — a token
    // alone can't bypass the temp-password gate.
    Route::middleware(['auth:sanctum', 'password.changed'])->group(function () {

        Route::post('auth/logout',           [AuthController::class, 'logout']);
        Route::get('auth/me',                [AuthController::class, 'me']);
        Route::post('auth/change-password',  [AuthController::class, 'changePassword']);

        Route::get('notifications/my',           [NotificationController::class, 'mine']);
        Route::patch('notifications/{id}/read',  [NotificationController::class, 'markRead']);

        // Show one order — accessible to any authenticated user; the
        // controller's show() method authorizes per record (admin OR the
        // order's customer OR the employee who recorded the sale).
        // Lifted out of role:customer,admin so employees can view their
        // own sale receipt at /orders/{id} too.
        //
        // Constraint: {id} must look like a UUID. Without this, the
        // wildcard would swallow sibling paths like /orders/my-sales,
        // /orders/customer-lookup, /orders/employee-sale that are
        // registered LATER in the file — Laravel matches the first
        // route that fits, and "my-sales" trivially fits {id}.
        Route::get('orders/{id}', [OrderController::class, 'show'])
            ->where('id', '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}');
        Route::get('orders/{id}/status', [OrderController::class, 'status'])
            ->where('id', '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}');

        // ─── CUSTOMER ────────────────────────────────────────
        Route::middleware('role:customer,admin')->group(function () {
            Route::get('orders/my',               [OrderController::class, 'mine']);
            Route::post('orders',                 [OrderController::class, 'store']);

            Route::get('addresses',               [AddressController::class, 'index']);
            Route::post('addresses',              [AddressController::class, 'store']);
            Route::put('addresses/{id}',          [AddressController::class, 'update']);
            Route::delete('addresses/{id}',       [AddressController::class, 'destroy']);

            Route::get('events/my-registrations', [EventController::class, 'myRegistrations']);
            Route::post('events/{id}/register',   [EventController::class, 'register']);
        });

        // ─── EMPLOYEE ────────────────────────────────────────
        Route::middleware('role:employee,admin')->group(function () {
            Route::post('orders/employee-sale',       [OrderController::class, 'employeeSale']);
            Route::get('orders/my-sales',             [OrderController::class, 'mySales']);
            Route::get('orders/my-sales/summary',     [OrderController::class, 'mySalesSummary']);
            // Phone lookup is enumeration-friendly — throttle aggressively
            // (30 requests per minute per authenticated employee).
            Route::get('orders/customer-lookup',      [OrderController::class, 'customerLookup'])
                ->middleware('throttle:30,1');
        });

        // ─── ADMIN ───────────────────────────────────────────
        Route::middleware('role:admin')->prefix('admin')->group(function () {

            Route::get('orders',                       [OrderController::class, 'adminIndex']);
            Route::get('orders/export',                [OrderController::class, 'export']);
            Route::get('orders/{id}',                  [OrderController::class, 'show']);
            Route::patch('orders/{id}/status',         [OrderController::class, 'updateStatus']);
            Route::post('orders/bulk-status',          [OrderController::class, 'bulkStatus']);

            Route::get('products',                     [ProductController::class, 'index']);
            Route::post('products',                    [ProductController::class, 'store']);
            Route::put('products/{id}',                [ProductController::class, 'update']);
            Route::patch('products/{id}/toggle',       [ProductController::class, 'toggle']);
            Route::post('products/bulk-price',         [ProductController::class, 'bulkPrice']);

            Route::get('announcements',                [AnnouncementController::class, 'index']);
            Route::post('announcements',               [AnnouncementController::class, 'store']);
            Route::put('announcements/{id}',           [AnnouncementController::class, 'update']);
            Route::patch('announcements/{id}/toggle',  [AnnouncementController::class, 'toggle']);
            Route::delete('announcements/{id}',        [AnnouncementController::class, 'destroy']);

            Route::get('events',                       [EventController::class, 'index']);
            Route::post('events',                      [EventController::class, 'store']);
            Route::put('events/{id}',                  [EventController::class, 'update']);
            Route::patch('events/{id}/status',         [EventController::class, 'setStatus']);
            Route::get('events/{id}/registrations',    [EventController::class, 'registrations']);
            Route::patch('events/{id}/registrations/{regId}/checkin', [EventController::class, 'checkin']);
            Route::post('events/{id}/cancel',          [EventController::class, 'cancel']);

            Route::get('campaigns',                    [CampaignController::class, 'index']);
            Route::post('campaigns',                   [CampaignController::class, 'store']);
            Route::put('campaigns/{id}',               [CampaignController::class, 'update']);
            Route::patch('campaigns/{id}/toggle',      [CampaignController::class, 'toggle']);

            Route::get('employees',                    [EmployeeController::class, 'index']);
            Route::post('employees',                   [EmployeeController::class, 'store']);
            Route::put('employees/{id}',               [EmployeeController::class, 'update']);
            Route::patch('employees/{id}/status',      [EmployeeController::class, 'setStatus']);
            Route::post('employees/{id}/reset-password', [EmployeeController::class, 'resetPassword']);
            Route::get('employees/{id}/sales',         [EmployeeController::class, 'sales']);

            Route::get('customers',                    [CustomerController::class, 'index']);
            Route::get('customers/{id}',               [CustomerController::class, 'show']);

            Route::get('analytics/summary',            [AnalyticsController::class, 'summary']);
            Route::get('analytics/revenue',            [AnalyticsController::class, 'revenue']);
            Route::get('analytics/products',           [AnalyticsController::class, 'products']);
            Route::get('analytics/employees',          [AnalyticsController::class, 'employees']);
            Route::get('analytics/campaigns',          [AnalyticsController::class, 'campaigns']);
            Route::get('analytics/customers',          [AnalyticsController::class, 'customers']);

            Route::post('upload/image',                [UploadController::class, 'image']);

            Route::get('audit-logs',                   [AuditLogController::class, 'index']);
        });
    });
});
