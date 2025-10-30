import { db } from '@/db';
import { users } from '@/db/schema';

async function main() {
    const sampleUsers = [
        {
            name: 'John Smith',
            email: 'john.smith@realestate.com',
            phone: '+1-555-234-5678',
            role: 'admin',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=JohnSmith',
            isActive: true,
            permissions: JSON.stringify(["manage_users", "manage_leads", "manage_projects", "manage_settings", "view_reports", "manage_campaigns"]),
            teamId: 1,
            createdAt: new Date('2024-08-15').toISOString(),
            updatedAt: new Date('2024-08-15').toISOString(),
        },
        {
            name: 'Sarah Johnson',
            email: 'sarah.johnson@realestate.com',
            phone: '+1-555-876-5432',
            role: 'admin',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SarahJohnson',
            isActive: true,
            permissions: JSON.stringify(["manage_users", "manage_leads", "manage_projects", "manage_settings", "view_reports", "manage_campaigns"]),
            teamId: 2,
            createdAt: new Date('2024-09-01').toISOString(),
            updatedAt: new Date('2024-09-02').toISOString(),
        },
        {
            name: 'Michael Chen',
            email: 'michael.chen@realestate.com',
            phone: '+1-555-345-7890',
            role: 'manager',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MichaelChen',
            isActive: true,
            permissions: JSON.stringify(["manage_leads", "view_projects", "view_reports", "assign_leads"]),
            teamId: 1,
            createdAt: new Date('2024-09-10').toISOString(),
            updatedAt: new Date('2024-09-11').toISOString(),
        },
        {
            name: 'Emily Rodriguez',
            email: 'emily.rodriguez@realestate.com',
            phone: '+1-555-987-6543',
            role: 'manager',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=EmilyRodriguez',
            isActive: true,
            permissions: JSON.stringify(["manage_leads", "view_projects", "view_reports", "assign_leads"]),
            teamId: 3,
            createdAt: new Date('2024-10-05').toISOString(),
            updatedAt: new Date('2024-10-05').toISOString(),
        },
        {
            name: 'David Kim',
            email: 'david.kim@realestate.com',
            phone: '+1-555-456-7891',
            role: 'manager',
            isActive: true,
            permissions: JSON.stringify(["manage_leads", "view_projects", "view_reports", "assign_leads"]),
            teamId: 2,
            createdAt: new Date('2024-10-20').toISOString(),
            updatedAt: new Date('2024-10-21').toISOString(),
        },
        {
            name: 'Lisa Anderson',
            email: 'lisa.anderson@realestate.com',
            phone: '+1-555-234-8901',
            role: 'agent',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=LisaAnderson',
            isActive: true,
            permissions: JSON.stringify(["view_leads", "update_own_leads", "view_projects"]),
            teamId: 1,
            createdAt: new Date('2024-11-01').toISOString(),
            updatedAt: new Date('2024-11-01').toISOString(),
        },
        {
            name: 'James Brown',
            email: 'james.brown@realestate.com',
            phone: '+1-555-567-8902',
            role: 'agent',
            isActive: true,
            permissions: JSON.stringify(["view_leads", "update_own_leads", "view_projects"]),
            teamId: 2,
            createdAt: new Date('2024-11-10').toISOString(),
            updatedAt: new Date('2024-11-12').toISOString(),
        },
        {
            name: 'Maria Garcia',
            email: 'maria.garcia@realestate.com',
            phone: '+1-555-678-9012',
            role: 'agent',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MariaGarcia',
            isActive: false,
            permissions: JSON.stringify(["view_leads", "update_own_leads", "view_projects"]),
            teamId: 3,
            createdAt: new Date('2024-11-15').toISOString(),
            updatedAt: new Date('2024-12-01').toISOString(),
        },
        {
            name: 'Robert Taylor',
            email: 'robert.taylor@realestate.com',
            phone: '+1-555-789-0123',
            role: 'agent',
            isActive: true,
            permissions: JSON.stringify(["view_leads", "update_own_leads", "view_projects"]),
            teamId: 1,
            createdAt: new Date('2024-12-05').toISOString(),
            updatedAt: new Date('2024-12-05').toISOString(),
        },
        {
            name: 'Jennifer Wilson',
            email: 'jennifer.wilson@realestate.com',
            phone: '+1-555-890-1234',
            role: 'agent',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=JenniferWilson',
            isActive: true,
            permissions: JSON.stringify(["view_leads", "update_own_leads", "view_projects"]),
            teamId: 2,
            createdAt: new Date('2024-12-15').toISOString(),
            updatedAt: new Date('2024-12-16').toISOString(),
        }
    ];

    await db.insert(users).values(sampleUsers);
    
    console.log('✅ Users seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});