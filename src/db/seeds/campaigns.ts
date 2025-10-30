import { db } from '@/db';
import { campaigns } from '@/db/schema';

async function main() {
    const sampleCampaigns = [
        {
            name: 'Spring Launch 2024',
            type: 'email',
            status: 'draft',
            budget: '150000',
            spent: '0',
            leads: JSON.stringify([]),
            conversions: 0,
            startDate: new Date('2024-06-15').toISOString(),
            endDate: new Date('2024-07-15').toISOString(),
            createdAt: new Date('2024-05-20').toISOString(),
            updatedAt: new Date('2024-05-20').toISOString(),
        },
        {
            name: 'Luxury Apartments Promo',
            type: 'email',
            status: 'active',
            budget: '500000',
            spent: '175000',
            leads: JSON.stringify([1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35, 37, 39, 41, 43, 45, 47, 49, 51, 53, 55]),
            conversions: 4,
            startDate: new Date('2024-05-10').toISOString(),
            endDate: new Date('2024-07-10').toISOString(),
            createdAt: new Date('2024-04-25').toISOString(),
            updatedAt: new Date('2024-05-29').toISOString(),
        },
        {
            name: 'First-Time Buyer Offer',
            type: 'sms',
            status: 'active',
            budget: '100000',
            spent: '45000',
            leads: JSON.stringify([2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30]),
            conversions: 2,
            startDate: new Date('2024-05-15').toISOString(),
            endDate: new Date('2024-06-30').toISOString(),
            createdAt: new Date('2024-05-01').toISOString(),
            updatedAt: new Date('2024-05-28').toISOString(),
        },
        {
            name: 'End of Season Sale',
            type: 'social',
            status: 'active',
            budget: '250000',
            spent: '120000',
            leads: JSON.stringify([5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 11, 16, 21, 26, 31, 36, 41, 46, 51]),
            conversions: 3,
            startDate: new Date('2024-05-01').toISOString(),
            endDate: new Date('2024-06-25').toISOString(),
            createdAt: new Date('2024-04-15').toISOString(),
            updatedAt: new Date('2024-05-27').toISOString(),
        },
        {
            name: 'New Project Announcement',
            type: 'email',
            status: 'paused',
            budget: '150000',
            spent: '85000',
            leads: JSON.stringify([3, 8, 13, 18, 23, 28, 33, 38, 43, 48, 53]),
            conversions: 1,
            startDate: new Date('2024-04-10').toISOString(),
            endDate: new Date('2024-07-01').toISOString(),
            createdAt: new Date('2024-03-20').toISOString(),
            updatedAt: new Date('2024-05-12').toISOString(),
        },
        {
            name: 'Festive Discount Campaign',
            type: 'sms',
            status: 'paused',
            budget: '100000',
            spent: '55000',
            leads: JSON.stringify([7, 14, 21, 28, 35, 42, 49, 12, 19, 26, 33, 40, 47, 54]),
            conversions: 1,
            startDate: new Date('2024-04-01').toISOString(),
            endDate: new Date('2024-06-20').toISOString(),
            createdAt: new Date('2024-03-10').toISOString(),
            updatedAt: new Date('2024-05-05').toISOString(),
        },
        {
            name: 'Premium Property Showcase',
            type: 'social',
            status: 'completed',
            budget: '250000',
            spent: '248000',
            leads: JSON.stringify([1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34, 37, 40, 43, 46, 49, 52, 55, 9, 15, 27, 39, 51]),
            conversions: 4,
            startDate: new Date('2024-02-01').toISOString(),
            endDate: new Date('2024-04-15').toISOString(),
            createdAt: new Date('2024-01-10').toISOString(),
            updatedAt: new Date('2024-04-16').toISOString(),
        },
        {
            name: 'Summer Open House Series',
            type: 'sms',
            status: 'completed',
            budget: '50000',
            spent: '49500',
            leads: JSON.stringify([2, 6, 11, 17, 24, 32, 41, 48]),
            conversions: 1,
            startDate: new Date('2024-01-15').toISOString(),
            endDate: new Date('2024-03-20').toISOString(),
            createdAt: new Date('2023-12-20').toISOString(),
            updatedAt: new Date('2024-03-21').toISOString(),
        },
    ];

    await db.insert(campaigns).values(sampleCampaigns);
    
    console.log('✅ Campaigns seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});