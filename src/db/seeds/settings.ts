import { db } from '@/db';
import { settings } from '@/db/schema';

async function main() {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const sampleSettings = [
        {
            organizationName: 'Prime Real Estate CRM',
            logo: 'https://api.dicebear.com/7.x/initials/svg?seed=PRECRM&backgroundColor=4f46e5',
            timezone: 'America/New_York',
            currency: 'USD',
            emailIntegrations: JSON.stringify({
                provider: 'smtp',
                host: 'smtp.gmail.com',
                port: 587,
                secure: false,
                auth: {
                    user: 'noreply@primerealestate.com',
                    password: 'encrypted_password_here'
                },
                from: 'Prime Real Estate <noreply@primerealestate.com>'
            }),
            smsIntegrations: JSON.stringify({
                provider: 'twilio',
                accountSid: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
                authToken: 'your_auth_token_here',
                fromNumber: '+1234567890'
            }),
            calendarSync: JSON.stringify({
                enabled: true,
                provider: 'google',
                calendarId: 'primary',
                syncActivities: ['meeting', 'task']
            }),
            webhooks: JSON.stringify([
                {
                    name: 'Lead Created',
                    url: 'https://hooks.zapier.com/hooks/catch/123456/abcdef/',
                    events: ['lead.created', 'lead.updated'],
                    active: true
                },
                {
                    name: 'Deal Closed',
                    url: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXX',
                    events: ['lead.closed'],
                    active: true
                }
            ]),
            customFields: JSON.stringify([
                {
                    name: 'Property Type Preference',
                    field: 'propertyTypePreference',
                    type: 'select',
                    options: ['Apartment', 'Villa', 'Plot', 'Commercial'],
                    appliesTo: 'lead'
                },
                {
                    name: 'Lead Rating',
                    field: 'leadRating',
                    type: 'text',
                    appliesTo: 'lead'
                },
                {
                    name: 'Broker License Number',
                    field: 'licenseNumber',
                    type: 'text',
                    appliesTo: 'broker'
                }
            ]),
            createdAt: sixMonthsAgo.toISOString(),
            updatedAt: new Date().toISOString()
        }
    ];

    await db.insert(settings).values(sampleSettings);
    
    console.log('✅ Settings seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});