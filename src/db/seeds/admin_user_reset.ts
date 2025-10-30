import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { hash } from 'better-auth/utils/password';
import { randomUUID } from 'crypto';

async function main() {
    try {
        // Check if admin user exists
        const existingUser = await db.run(
            sql`SELECT id FROM user WHERE email = 'admin@growthstermedia.com'`
        );

        // If user exists, delete it and associated account
        if (existingUser.rows && existingUser.rows.length > 0) {
            const userId = existingUser.rows[0].id as string;
            
            // Delete associated account first (foreign key constraint)
            await db.run(
                sql`DELETE FROM account WHERE user_id = ${userId}`
            );
            
            // Delete user
            await db.run(
                sql`DELETE FROM user WHERE id = ${userId}`
            );
            
            console.log('🗑️ Existing admin user deleted');
        }

        // Hash the password
        const hashedPassword = await hash('Admin@2025');

        // Generate unique IDs
        const userId = randomUUID();
        const accountId = randomUUID();

        // Get current timestamp
        const now = Math.floor(Date.now());

        // Insert user with raw SQL
        await db.run(
            sql`INSERT INTO user (id, name, email, email_verified, image, created_at, updated_at) 
                VALUES (${userId}, ${'Admin User'}, ${'admin@growthstermedia.com'}, ${1}, ${null}, ${now}, ${now})`
        );

        console.log('✅ Admin user created successfully');

        // Insert account with raw SQL
        await db.run(
            sql`INSERT INTO account (id, account_id, provider_id, user_id, access_token, refresh_token, id_token, access_token_expires_at, refresh_token_expires_at, scope, password, created_at, updated_at) 
                VALUES (${accountId}, ${'admin@growthstermedia.com'}, ${'credential'}, ${userId}, ${null}, ${null}, ${null}, ${null}, ${null}, ${null}, ${hashedPassword}, ${now}, ${now})`
        );

        console.log('✅ Admin account created successfully');
        console.log('📧 Email: admin@growthstermedia.com');
        console.log('🔑 Password: Admin@2025');
        
    } catch (error) {
        console.error('❌ Admin user seeder failed:', error);
        throw error;
    }
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
    process.exit(1);
});