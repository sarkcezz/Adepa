# ── Laravel API → Cloud Run ─────────────────────────────────────────────
# Uses serversideup/php (nginx + php-fpm, Laravel-tuned, listens on 8080,
# the Cloud Run default). Runtime config (DB, APP_KEY, Paystack, Cloudinary)
# comes from Cloud Run env vars / Secret Manager, never baked into the image.

FROM serversideup/php:8.3-fpm-nginx AS base

WORKDIR /var/www/html

# System deps for common Laravel extensions are already in the base image
# (pdo_mysql, gd, bcmath, etc.). Composer is included.

USER root
COPY --chown=www-data:www-data . .

USER www-data
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-progress

# Healthcheck path served by Laravel (config/app.php health endpoint /up).
ENV HEALTHCHECK_PATH=/up

# Cloud Run sets PORT=8080; the base image's nginx already listens on 8080.
EXPOSE 8080
