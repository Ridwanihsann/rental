<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create default admin user if not exists
        User::firstOrCreate(
            ['email' => 'admin@rental.com'],
            [
                'name' => 'Admin',
                'email' => 'admin@rental.com',
                'password' => Hash::make('admin123'),
            ]
        );
    }
}
