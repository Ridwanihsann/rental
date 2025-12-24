FROM php:8.4-cli

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# Get Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /app

# Copy all application files
COPY . .

# Install composer dependencies (skip scripts to avoid artisan issues during build)
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts

# Run artisan package:discover manually after composer install
RUN php artisan package:discover --ansi

# Install npm dependencies and build assets
RUN npm ci && npm run build

# Create storage directories and set permissions
RUN mkdir -p storage/framework/{sessions,views,cache} storage/logs bootstrap/cache \
    && chmod -R 777 storage bootstrap/cache

# Expose port for documentation
EXPOSE 8000

# Start command - run migrations, link storage, optimize, and start PHP server with custom config
CMD ["sh", "-c", "php artisan migrate --force && php artisan db:seed --force && php artisan storage:link && php artisan config:cache && php artisan route:cache && php artisan view:cache && php -c php.ini -S 0.0.0.0:${PORT:-8000} -t public"]
