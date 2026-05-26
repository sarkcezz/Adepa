<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pork_events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->date('event_date');
            $table->time('event_time');
            $table->string('venue_name');
            $table->text('venue_address');
            $table->integer('flat_rate_kobo');
            $table->integer('capacity');
            $table->integer('registered_count')->default(0);
            $table->text('description');
            $table->string('image_url', 500)->nullable();
            $table->enum('status', ['DRAFT', 'PUBLISHED', 'CANCELLED'])->default('DRAFT');
            $table->foreignUuid('created_by')->constrained('users');
            $table->timestamps();
            $table->index(['event_date', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pork_events');
    }
};
