<?php

use App\Http\Controllers\Api\V1\AddressController;
use App\Http\Controllers\Api\V1\AnalyticsController;
use App\Http\Controllers\Api\V1\AnnouncementController;
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
    Route::middleware('auth:sanctum')->group(function () {

        Route::post('auth/logout',           [AuthController::class, 'logout']);
        Route::get('auth/me',                [AuthController::class, 'me']);
        Route::post('auth/change-password',  [AuthController::class, 'changePassword']);

        Route::get('notifications/my',           [NotificationController::class, 'mine']);
        Route::patch('notifications/{id}/read',  [NotificationController::class, 'markRead']);

        // ─── CUSTOMER ────────────────────────────────────────
        Route::middleware('role:customer,admin')->group(function () {
            Route::get('orders/my',               [OrderController::class, 'mine']);
            Route::get('orders/{id}',             [OrderController::class, 'show']);
            Route::get('orders/{id}/status',      [OrderController::class, 'status']);
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
            Route::get('orders/customer-lookup',      [OrderController::class, 'customerLookup']);
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
        });
    });
});
