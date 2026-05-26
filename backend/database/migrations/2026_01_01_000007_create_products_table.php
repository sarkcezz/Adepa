<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->enum('product_line', ['RAW', 'SPICED', 'READY_TO_EAT']);
            $table->enum('variant', ['PLAIN', 'MILD', 'SPICY', 'NONE'])->default('NONE');
            $table->integer('weight_grams')->nullable();
            $table->integer('price_kobo');
            $table->text('description');
            $table->text('ingredients')->nullable();
            $table->text('storage_instructions')->nullable();
            $table->tinyInteger('heat_level')->default(0);
            $table->string('image_url', 500)->nullable();
            $table->integer('stock_qty')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->index(['product_line', 'variant']);
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
