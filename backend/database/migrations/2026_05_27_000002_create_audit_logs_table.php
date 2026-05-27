<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->char('id', 36)->primary();

            // Who did it (nullable for system actions like the daily cron)
            $table->char('user_id', 36)->nullable()->index();
            $table->string('user_name')->nullable();   // snapshot, survives user deletion
            $table->string('user_role', 20)->nullable();

            // What changed
            $table->string('action', 60)->index();      // e.g. product.update, employee.reset_password
            $table->string('subject_type', 80)->nullable();  // model class
            $table->char('subject_id', 36)->nullable()->index();
            $table->string('subject_label')->nullable();     // human-readable e.g. "Plain pork 200g"

            // Optional before/after snapshot for diffs
            $table->json('changes')->nullable();
            $table->text('note')->nullable();

            // Request context
            $table->string('ip', 45)->nullable();
            $table->string('user_agent', 255)->nullable();

            $table->timestamp('created_at')->useCurrent();

            $table->index(['subject_type', 'subject_id']);
            $table->index(['created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
