#!/bin/bash

# Run migrations
php artisan migrate --force

# Seed database
php artisan db:seed --force

# Get port as integer (default 8000)
PORT_NUM=${PORT:-8000}

# Start the built-in PHP server directly (bypassing artisan serve)
php -S 0.0.0.0:$PORT_NUM -t public
