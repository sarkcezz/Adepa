<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('order_number', 20)->unique();
            $table->foreignUuid('customer_id')->constrained('users');
            $table->foreignUuid('employee_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('status', ['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'])->default('PENDING');
            $table->enum('delivery_method', ['HOME', 'PICKUP', 'EVENT']);
            $table->foreignUuid('address_id')->nullable()->constrained('addresses')->nullOnDelete();
            $table->foreignUuid('event_id')->nullable()->constrained('pork_events')->nullOnDelete();
            $table->string('pickup_location_name')->nullable();
            $table->integer('subtotal_kobo');
            $table->integer('delivery_fee_kobo')->default(0);
            $table->integer('discount_kobo')->default(0);
            $table->integer('total_kobo');
            $table->enum('payment_method', ['MOMO', 'CARD', 'CASH', 'BANK'])->default('MOMO');
            $table->string('payment_reference')->nullable();
            $table->enum('payment_status', ['PENDING', 'PAID', 'FAILED'])->default('PENDING');
            $table->string('paystack_reference')->nullable();
            $table->enum('source', ['ONLINE', 'EMPLOYEE_SALE'])->default('ONLINE');
            $table->foreignUuid('campaign_id')->nullable()->constrained('campaigns')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index('status');
            $table->index('payment_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
