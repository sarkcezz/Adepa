<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('campaigns', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('code', 50)->unique();
            $table->enum('discount_type', ['PERCENT', 'FIXED', 'FREE_DELIVERY']);
            $table->integer('discount_value');
            $table->integer('min_order_kobo')->default(0);
            $table->integer('max_usage')->nullable();
            $table->integer('usage_count')->default(0);
            $table->dateTime('valid_from');
            $table->dateTime('valid_to');
            $table->json('applicable_lines')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->index(['valid_from', 'valid_to']);
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('campaigns');
    }
};
