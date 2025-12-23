FROM php:8.4-cli

# Cache buster - change to force rebuild
ARG CACHEBUST=2

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
    npm

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# Get Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /app

# Copy composer files first for better caching
COPY composer.json composer.lock ./

# Install composer dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Copy package files
COPY package.json package-lock.json ./

# Install npm dependencies
RUN npm ci

# Copy all application files
COPY . .

# Build assets
RUN npm run build

# Create storage directories and set permissions
RUN mkdir -p storage/framework/{sessions,views,cache} storage/logs bootstrap/cache \
    && chmod -R 777 storage bootstrap/cache

# Start command - use PHP built-in server directly
CMD ["sh", "-c", "php artisan migrate --force && php artisan db:seed --force && php -S 0.0.0.0:${PORT:-8000} -t public"]
