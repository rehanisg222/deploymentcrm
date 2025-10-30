import { db } from '@/db';
import { user, account } from '@/db/schema';
import { hash } from 'better-auth/utils/password';
import { eq } from 'drizzle-orm';

async function main() {
    try {
        // Check if admin user already exists
        const existingUser = await db
            .select()
            .from(user)
            .where(eq(user.email, 'admin@growthstermedia.com'))
            .limit(1);

        if (existingUser.length > 0) {
            console.log('Admin user already exists, skipping...');
            return;
        }

        // Hash the password
        const hashedPassword = await hash('Admin@2025');

        // Get current timestamp as integer
        const now = Math.floor(Date.now());

        // Insert user
        await db.insert(user).values({
            id: 'admin_user_001',
            name: 'Admin User',
            email: 'admin@growthstermedia.com',
            emailVerified: true,
            image: null,
            createdAt: now,
            updatedAt: now,
        });

        // Insert account
        await db.insert(account).values({
            id: 'admin_account_001',
            accountId: 'admin@growthstermedia.com',
            providerId: 'credential',
            userId: 'admin_user_001',
            password: hashedPassword,
            accessToken: null,
            refreshToken: null,
            idToken: null,
            accessTokenExpiresAt: null,
            refreshTokenExpiresAt: null,
            scope: null,
            createdAt: now,
            updatedAt: now,
        });

        console.log('✅ Admin user seeder completed successfully');
    } catch (error) {
        console.error('❌ Seeder failed:', error);
        throw error;
    }
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
    process.exit(1);
});