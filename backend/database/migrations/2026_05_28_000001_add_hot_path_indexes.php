<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds indexes on columns queried by hot paths — analytics, employee
 * sales lookup, admin filtering, customer order history. Safe to run
 * on a populated DB; MySQL creates indexes online by default.
 *
 * Each index is added inside a try/catch so re-running on a DB that
 * already has some of them (e.g. partial run) won't fail.
 */
return new class extends Migration {
    public function up(): void
    {
        $this->safeAddIndex('orders', ['payment_status'], 'orders_payment_status_idx');
        $this->safeAddIndex('orders', ['employee_id'],    'orders_employee_id_idx');
        $this->safeAddIndex('orders', ['source'],         'orders_source_idx');
        $this->safeAddIndex('orders', ['created_at'],     'orders_created_at_idx');
        $this->safeAddIndex('orders', ['customer_id'],    'orders_customer_id_idx');
        $this->safeAddIndex('orders', ['status'],         'orders_status_idx');

        // Composite for the very common "my sales today" query
        $this->safeAddIndex('orders', ['employee_id', 'source', 'created_at'], 'orders_emp_source_created_idx');

        // Order items roll-up (top products)
        $this->safeAddIndex('order_items', ['product_id'], 'order_items_product_id_idx');

        // Users role filters (admin lists employees / customers)
        $this->safeAddIndex('users', ['role'],      'users_role_idx');
        $this->safeAddIndex('users', ['is_active'], 'users_is_active_idx');

        // Product browse
        $this->safeAddIndex('products', ['is_active'],    'products_is_active_idx');
        $this->safeAddIndex('products', ['product_line'], 'products_product_line_idx');
    }

    public function down(): void
    {
        $this->safeDropIndex('orders', 'orders_payment_status_idx');
        $this->safeDropIndex('orders', 'orders_employee_id_idx');
        $this->safeDropIndex('orders', 'orders_source_idx');
        $this->safeDropIndex('orders', 'orders_created_at_idx');
        $this->safeDropIndex('orders', 'orders_customer_id_idx');
        $this->safeDropIndex('orders', 'orders_status_idx');
        $this->safeDropIndex('orders', 'orders_emp_source_created_idx');
        $this->safeDropIndex('order_items', 'order_items_product_id_idx');
        $this->safeDropIndex('users', 'users_role_idx');
        $this->safeDropIndex('users', 'users_is_active_idx');
        $this->safeDropIndex('products', 'products_is_active_idx');
        $this->safeDropIndex('products', 'products_product_line_idx');
    }

    protected function safeAddIndex(string $table, array $columns, string $name): void
    {
        try {
            Schema::table($table, function (Blueprint $t) use ($columns, $name) {
                $t->index($columns, $name);
            });
        } catch (\Throwable $e) {
            // Likely duplicate-key — silently skip. We log the message so
            // failures other than "already exists" are still visible.
            if (! str_contains(strtolower($e->getMessage()), 'duplicate')) {
                throw $e;
            }
        }
    }

    protected function safeDropIndex(string $table, string $name): void
    {
        try {
            Schema::table($table, function (Blueprint $t) use ($name) {
                $t->dropIndex($name);
            });
        } catch (\Throwable $e) {
            // ignore if missing
        }
    }
};
