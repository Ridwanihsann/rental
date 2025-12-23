#!/bin/bash

# Run migrations
php artisan migrate --force

# Seed database
php artisan db:seed --force

# Start server with proper port handling
php artisan serve --host=0.0.0.0 --port=${PORT:-8000}
