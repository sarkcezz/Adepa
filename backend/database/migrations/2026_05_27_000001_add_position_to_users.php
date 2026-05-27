<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Position hierarchy for employees only. customers/admin keep null.
            //   cashier      → record sales, view own history
            //   stand_lead   → cashier + apply discounts, hold/resume carts
            //   supervisor   → stand_lead + void/refund sales
            //   manager      → supervisor + set targets, open new stands
            $table->string('position', 20)->nullable()->after('employee_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('position');
        });
    }
};
