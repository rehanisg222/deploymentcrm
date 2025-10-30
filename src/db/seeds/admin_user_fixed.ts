import { db } from '@/db';
import { user, account } from '@/db/schema';
import { hash } from 'better-auth/utils/password';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';

async function main() {
    try {
        const adminEmail = 'admin@growthstermedia.com';
        const adminPassword = 'Admin@2025';

        // Check if admin user already exists
        const existingUser = await db
            .select()
            .from(user)
            .where(eq(user.email, adminEmail))
            .limit(1);

        // If user exists, delete account and user records
        if (existingUser.length > 0) {
            console.log('🔄 Existing admin user found. Cleaning up...');
            
            // Delete account first (foreign key constraint)
            await db.run({
                sql: `DELETE FROM account WHERE user_id = ?`,
                params: [existingUser[0].id]
            });
            
            // Delete user
            await db.run({
                sql: `DELETE FROM user WHERE id = ?`,
                params: [existingUser[0].id]
            });
            
            console.log('✅ Old admin user deleted successfully');
        }

        // Generate UUID for user
        const userId = randomUUID();
        
        // Hash password using better-auth
        const hashedPassword = await hash(adminPassword);
        
        // Get current timestamp
        const now = Math.floor(Date.now());

        // Create new user
        const newUser = {
            id: userId,
            name: 'Admin User',
            email: adminEmail,
            emailVerified: true,
            image: null,
            createdAt: now,
            updatedAt: now
        };

        await db.run({
            sql: `INSERT INTO user (id, name, email, email_verified, image, created_at, updated_at) 
                  VALUES (?, ?, ?, ?, ?, ?, ?)`,
            params: [
                newUser.id,
                newUser.name,
                newUser.email,
                newUser.emailVerified ? 1 : 0,
                newUser.image,
                newUser.createdAt,
                newUser.updatedAt
            ]
        });

        console.log('✅ Admin user created successfully');

        // Create account record with accountId = userId (CRITICAL for better-auth)
        const accountId = randomUUID();
        const newAccount = {
            id: accountId,
            accountId: userId, // MUST BE THE SAME AS user.id
            providerId: 'credential',
            userId: userId,
            password: hashedPassword,
            accessToken: null,
            refreshToken: null,
            idToken: null,
            accessTokenExpiresAt: null,
            refreshTokenExpiresAt: null,
            scope: null,
            createdAt: now,
            updatedAt: now
        };

        await db.run({
            sql: `INSERT INTO account (id, account_id, provider_id, user_id, password, access_token, refresh_token, id_token, access_token_expires_at, refresh_token_expires_at, scope, created_at, updated_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            params: [
                newAccount.id,
                newAccount.accountId,
                newAccount.providerId,
                newAccount.userId,
                newAccount.password,
                newAccount.accessToken,
                newAccount.refreshToken,
                newAccount.idToken,
                newAccount.accessTokenExpiresAt,
                newAccount.refreshTokenExpiresAt,
                newAccount.scope,
                newAccount.createdAt,
                newAccount.updatedAt
            ]
        });

        console.log('✅ Admin account created successfully');
        console.log('\n📧 Admin Credentials:');
        console.log(`   Email: ${adminEmail}`);
        console.log(`   Password: ${adminPassword}`);

        // Query and display created user
        const createdUser = await db
            .select()
            .from(user)
            .where(eq(user.id, userId))
            .limit(1);

        console.log('\n👤 Created User:');
        console.log(JSON.stringify(createdUser[0], null, 2));

        // Query and display created account
        const createdAccount = await db
            .select({
                id: account.id,
                accountId: account.accountId,
                providerId: account.providerId,
                userId: account.userId,
                createdAt: account.createdAt,
                updatedAt: account.updatedAt
            })
            .from(account)
            .where(eq(account.userId, userId))
            .limit(1);

        console.log('\n🔐 Created Account:');
        console.log(JSON.stringify(createdAccount[0], null, 2));

        console.log('\n✅ Admin user seeder completed successfully');
    } catch (error) {
        console.error('❌ Seeder failed:', error);
        throw error;
    }
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
    process.exit(1);
});