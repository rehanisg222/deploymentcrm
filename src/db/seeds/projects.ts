import { db } from '@/db';
import { projects } from '@/db/schema';

async function main() {
    const sampleProjects = [
        {
            name: 'Skyline Towers',
            type: 'residential',
            location: 'Downtown',
            developer: 'ABC Developers',
            price: '15000000-25000000',
            status: 'ready',
            units: JSON.stringify([
                { type: '2BHK', count: 45 },
                { type: '3BHK', count: 35 },
                { type: '4BHK', count: 20 }
            ]),
            amenities: JSON.stringify([
                'Swimming Pool',
                'Gym',
                'Parking',
                'Security',
                'Power Backup',
                'Clubhouse',
                'Rooftop Garden',
                'Kids Play Area'
            ]),
            images: JSON.stringify([
                'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00',
                'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2',
                'https://images.unsplash.com/photo-1512917774080-9991f1c4c750',
                'https://images.unsplash.com/photo-1613490493576-7fde63acd811'
            ]),
            description: 'Luxurious high-rise residential towers in the heart of downtown, offering panoramic city views, modern amenities, and excellent connectivity to business districts and entertainment hubs.',
            createdAt: new Date('2024-03-15').toISOString(),
            updatedAt: new Date('2024-03-15').toISOString()
        },
        {
            name: 'Green Valley Residences',
            type: 'residential',
            location: 'Suburb North',
            developer: 'Premium Constructions',
            price: '5000000-8000000',
            status: 'under-construction',
            units: JSON.stringify([
                { type: '2BHK', count: 60 },
                { type: '3BHK', count: 40 }
            ]),
            amenities: JSON.stringify([
                'Garden',
                'Jogging Track',
                'Parking',
                'Security',
                'Power Backup',
                'Kids Play Area',
                'Community Hall'
            ]),
            images: JSON.stringify([
                'https://images.unsplash.com/photo-1564013799919-ab600027ffc6',
                'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9',
                'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c'
            ]),
            description: 'Serene residential complex surrounded by lush greenery, perfect for families seeking peaceful living away from city chaos with excellent schools and hospitals nearby.',
            createdAt: new Date('2024-06-20').toISOString(),
            updatedAt: new Date('2024-08-10').toISOString()
        },
        {
            name: 'Metro Business Hub',
            type: 'commercial',
            location: 'Business District',
            developer: 'Metro Builders',
            price: '50000000-100000000',
            status: 'ready',
            units: JSON.stringify([
                { type: 'Office Space', sqft: '1000-5000' },
                { type: 'Retail', sqft: '500-2000' },
                { type: 'Food Court', sqft: '3000' }
            ]),
            amenities: JSON.stringify([
                'High-speed Elevators',
                'Parking',
                'Security',
                'Power Backup',
                'Central AC',
                'Conference Rooms',
                'Cafeteria'
            ]),
            images: JSON.stringify([
                'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab',
                'https://images.unsplash.com/photo-1497366811353-6870744d04b2',
                'https://images.unsplash.com/photo-1497366754035-f200968a6e72',
                'https://images.unsplash.com/photo-1556761175-b413da4baf72'
            ]),
            description: 'Premium commercial complex in the prime business district, offering state-of-the-art office spaces with modern infrastructure and excellent connectivity to metro stations.',
            createdAt: new Date('2024-01-10').toISOString(),
            updatedAt: new Date('2024-01-10').toISOString()
        },
        {
            name: 'Ocean View Apartments',
            type: 'residential',
            location: 'Waterfront',
            developer: 'Skyline Properties',
            price: '15000000-25000000',
            status: 'ready',
            units: JSON.stringify([
                { type: '3BHK', count: 30 },
                { type: '4BHK', count: 25 },
                { type: 'Penthouse', count: 5 }
            ]),
            amenities: JSON.stringify([
                'Swimming Pool',
                'Gym',
                'Parking',
                'Security',
                'Power Backup',
                'Clubhouse',
                'Beach Access',
                'Marina',
                'Spa'
            ]),
            images: JSON.stringify([
                'https://images.unsplash.com/photo-1512917774080-9991f1c4c750',
                'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c',
                'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3'
            ]),
            description: 'Exclusive waterfront living with breathtaking ocean views, private beach access, and world-class amenities for those who desire the finest coastal lifestyle.',
            createdAt: new Date('2024-02-28').toISOString(),
            updatedAt: new Date('2024-02-28').toISOString()
        },
        {
            name: 'Tech Park Plaza',
            type: 'commercial',
            location: 'Highway Road',
            developer: 'Urban Infrastructure',
            price: '10000000-50000000',
            status: 'under-construction',
            units: JSON.stringify([
                { type: 'Office Space', sqft: '500-3000' },
                { type: 'Retail', sqft: '200-1000' }
            ]),
            amenities: JSON.stringify([
                'High-speed Internet',
                'Parking',
                'Security',
                'Power Backup',
                'Cafeteria',
                'ATM',
                'Conference Rooms'
            ]),
            images: JSON.stringify([
                'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab',
                'https://images.unsplash.com/photo-1497366216548-37526070297c',
                'https://images.unsplash.com/photo-1497366754035-f200968a6e72'
            ]),
            description: 'Modern commercial complex strategically located on highway with excellent visibility and access, ideal for IT companies and retail businesses.',
            createdAt: new Date('2024-07-05').toISOString(),
            updatedAt: new Date('2024-09-20').toISOString()
        },
        {
            name: 'Heritage Gardens',
            type: 'residential',
            location: 'City Center',
            developer: 'ABC Developers',
            price: '8000000-15000000',
            status: 'ready',
            units: JSON.stringify([
                { type: '2BHK', count: 50 },
                { type: '3BHK', count: 45 }
            ]),
            amenities: JSON.stringify([
                'Garden',
                'Gym',
                'Parking',
                'Security',
                'Power Backup',
                'Kids Play Area',
                'Meditation Center',
                'Library'
            ]),
            images: JSON.stringify([
                'https://images.unsplash.com/photo-1600585154340-be6161a56a0c',
                'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9',
                'https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4'
            ]),
            description: 'Elegant residential project in city center with beautiful landscaped gardens, combining modern living with natural surroundings and excellent shopping facilities nearby.',
            createdAt: new Date('2024-04-12').toISOString(),
            updatedAt: new Date('2024-04-12').toISOString()
        },
        {
            name: 'Sunrise Heights',
            type: 'residential',
            location: 'Suburb North',
            developer: 'Premium Constructions',
            price: '5000000-8000000',
            status: 'under-construction',
            units: JSON.stringify([
                { type: '1BHK', count: 40 },
                { type: '2BHK', count: 60 }
            ]),
            amenities: JSON.stringify([
                'Parking',
                'Security',
                'Power Backup',
                'Garden',
                'Kids Play Area',
                'Gym'
            ]),
            images: JSON.stringify([
                'https://images.unsplash.com/photo-1564013799919-ab600027ffc6',
                'https://images.unsplash.com/photo-1600585154526-990dced4db0d',
                'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9'
            ]),
            description: 'Affordable housing project in growing suburban area, perfect for first-time homebuyers with easy access to schools, hospitals, and public transport.',
            createdAt: new Date('2024-08-15').toISOString(),
            updatedAt: new Date('2024-10-05').toISOString()
        },
        {
            name: 'Royal Plaza',
            type: 'commercial',
            location: 'Mall Road',
            developer: 'Metro Builders',
            price: '10000000-50000000',
            status: 'ready',
            units: JSON.stringify([
                { type: 'Retail', sqft: '300-1500' },
                { type: 'Food Court', sqft: '2000' },
                { type: 'Entertainment', sqft: '5000' }
            ]),
            amenities: JSON.stringify([
                'Parking',
                'Security',
                'Power Backup',
                'Central AC',
                'Escalators',
                'ATM',
                'Event Space'
            ]),
            images: JSON.stringify([
                'https://images.unsplash.com/photo-1441986300917-64674bd600d8',
                'https://images.unsplash.com/photo-1555529902-5261145633bf',
                'https://images.unsplash.com/photo-1567696911980-2eed69a46042'
            ]),
            description: 'Premium retail and entertainment complex on busy mall road, offering high footfall and excellent visibility for businesses.',
            createdAt: new Date('2024-05-08').toISOString(),
            updatedAt: new Date('2024-05-08').toISOString()
        },
        {
            name: 'Riverside Villas',
            type: 'residential',
            location: 'Waterfront',
            developer: 'Skyline Properties',
            price: '15000000-25000000',
            status: 'sold-out',
            units: JSON.stringify([
                { type: '3BHK Villa', count: 20 },
                { type: '4BHK Villa', count: 15 }
            ]),
            amenities: JSON.stringify([
                'Private Garden',
                'Swimming Pool',
                'Parking',
                'Security',
                'Power Backup',
                'Clubhouse',
                'Sports Complex',
                'Boat Club'
            ]),
            images: JSON.stringify([
                'https://images.unsplash.com/photo-1600585154340-be6161a56a0c',
                'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3',
                'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d',
                'https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4'
            ]),
            description: 'Exclusive villa community along the riverside, offering private gardens and luxurious living with stunning water views and tranquil environment.',
            createdAt: new Date('2023-12-20').toISOString(),
            updatedAt: new Date('2024-06-15').toISOString()
        },
        {
            name: 'Smart City Residences',
            type: 'residential',
            location: 'Business District',
            developer: 'Urban Infrastructure',
            price: '8000000-15000000',
            status: 'under-construction',
            units: JSON.stringify([
                { type: '2BHK', count: 70 },
                { type: '3BHK', count: 50 }
            ]),
            amenities: JSON.stringify([
                'Smart Home Systems',
                'Gym',
                'Parking',
                'Security',
                'Power Backup',
                'Clubhouse',
                'Co-working Space',
                'EV Charging'
            ]),
            images: JSON.stringify([
                'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00',
                'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2',
                'https://images.unsplash.com/photo-1512917774080-9991f1c4c750'
            ]),
            description: 'Technology-enabled smart homes in business district with IoT integration, offering modern lifestyle and convenience with green building features.',
            createdAt: new Date('2024-09-10').toISOString(),
            updatedAt: new Date('2024-11-01').toISOString()
        },
        {
            name: 'Phoenix Towers',
            type: 'residential',
            location: 'Downtown',
            developer: 'ABC Developers',
            price: '15000000-25000000',
            status: 'planning',
            units: JSON.stringify([
                { type: '3BHK', count: 40 },
                { type: '4BHK', count: 30 },
                { type: 'Penthouse', count: 10 }
            ]),
            amenities: JSON.stringify([
                'Swimming Pool',
                'Gym',
                'Parking',
                'Security',
                'Power Backup',
                'Sky Lounge',
                'Helipad',
                'Concierge Service'
            ]),
            images: JSON.stringify([
                'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00',
                'https://images.unsplash.com/photo-1613490493576-7fde63acd811'
            ]),
            description: 'Ultra-luxury residential towers in prime downtown location, featuring premium specifications and exclusive amenities for elite living.',
            createdAt: new Date('2024-11-15').toISOString(),
            updatedAt: new Date('2024-11-15').toISOString()
        },
        {
            name: 'Garden Court',
            type: 'residential',
            location: 'City Center',
            developer: 'Premium Constructions',
            price: '8000000-15000000',
            status: 'ready',
            units: JSON.stringify([
                { type: '2BHK', count: 55 },
                { type: '3BHK', count: 40 }
            ]),
            amenities: JSON.stringify([
                'Garden',
                'Parking',
                'Security',
                'Power Backup',
                'Kids Play Area',
                'Senior Citizens Corner',
                'Yoga Deck'
            ]),
            images: JSON.stringify([
                'https://images.unsplash.com/photo-1600585154340-be6161a56a0c',
                'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9',
                'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c'
            ]),
            description: 'Family-friendly residential complex with spacious apartments and extensive green areas in central location with easy access to all amenities.',
            createdAt: new Date('2024-03-25').toISOString(),
            updatedAt: new Date('2024-03-25').toISOString()
        },
        {
            name: 'Elite Business Center',
            type: 'commercial',
            location: 'Business District',
            developer: 'Metro Builders',
            price: '50000000-100000000',
            status: 'under-construction',
            units: JSON.stringify([
                { type: 'Office Space', sqft: '2000-10000' },
                { type: 'Conference Center', sqft: '5000' }
            ]),
            amenities: JSON.stringify([
                'High-speed Elevators',
                'Parking',
                'Security',
                'Power Backup',
                'Central AC',
                'Video Conferencing',
                'Business Lounge',
                'Helipad'
            ]),
            images: JSON.stringify([
                'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab',
                'https://images.unsplash.com/photo-1497366811353-6870744d04b2',
                'https://images.unsplash.com/photo-1497366754035-f200968a6e72'
            ]),
            description: 'Grade-A commercial office space with cutting-edge infrastructure, designed for multinational corporations and large enterprises.',
            createdAt: new Date('2024-06-30').toISOString(),
            updatedAt: new Date('2024-10-15').toISOString()
        },
        {
            name: 'Harmony Homes',
            type: 'residential',
            location: 'Suburb North',
            developer: 'Skyline Properties',
            price: '5000000-8000000',
            status: 'sold-out',
            units: JSON.stringify([
                { type: '2BHK', count: 80 },
                { type: '3BHK', count: 40 }
            ]),
            amenities: JSON.stringify([
                'Garden',
                'Parking',
                'Security',
                'Power Backup',
                'Kids Play Area',
                'Community Center',
                'Sports Court'
            ]),
            images: JSON.stringify([
                'https://images.unsplash.com/photo-1564013799919-ab600027ffc6',
                'https://images.unsplash.com/photo-1600585154526-990dced4db0d',
                'https://images.unsplash.com/photo-1600585154340-be6161a56a0c'
            ]),
            description: 'Affordable residential community in peaceful suburban setting, offering value for money with good connectivity and social infrastructure.',
            createdAt: new Date('2023-11-05').toISOString(),
            updatedAt: new Date('2024-07-20').toISOString()
        },
        {
            name: 'Innovation Hub',
            type: 'commercial',
            location: 'Highway Road',
            developer: 'Urban Infrastructure',
            price: '10000000-50000000',
            status: 'planning',
            units: JSON.stringify([
                { type: 'Office Space', sqft: '1000-5000' },
                { type: 'Co-working', sqft: '10000' },
                { type: 'Retail', sqft: '500-1500' }
            ]),
            amenities: JSON.stringify([
                'High-speed Internet',
                'Parking',
                'Security',
                'Power Backup',
                'Cafeteria',
                'Innovation Labs',
                'Event Space',
                'EV Charging'
            ]),
            images: JSON.stringify([
                'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab',
                'https://images.unsplash.com/photo-1497366216548-37526070297c'
            ]),
            description: 'Futuristic commercial hub designed for startups and tech companies, featuring flexible workspaces and collaborative environment with modern amenities.',
            createdAt: new Date('2024-10-20').toISOString(),
            updatedAt: new Date('2024-10-20').toISOString()
        }
    ];

    await db.insert(projects).values(sampleProjects);
    
    console.log('✅ Projects seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});