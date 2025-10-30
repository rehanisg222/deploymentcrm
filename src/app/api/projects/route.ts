import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq, like, and, or, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (id) {
      const project = await db.select().from(projects).where(eq(projects.id, parseInt(id))).limit(1);
      if (project.length === 0) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }
      return NextResponse.json(project[0]);
    }

    const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    let query = db.select().from(projects);
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(projects.name, `%${search}%`),
          like(projects.location, `%${search}%`)
        )
      );
    }

    if (type) conditions.push(eq(projects.type, type));
    if (status) conditions.push(eq(projects.status, status));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query.orderBy(desc(projects.createdAt)).limit(limit).offset(offset);
    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, location, developer, price, status = 'planning', units, amenities, images, description } = body;

    if (!name || !type || !location || !developer || !price) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const newProject = await db.insert(projects).values({
      name, type, location, developer, price, status,
      units: units ? JSON.stringify(units) : null,
      amenities: amenities ? JSON.stringify(amenities) : null,
      images: images ? JSON.stringify(images) : null,
      description, createdAt: now, updatedAt: now
    }).returning();

    return NextResponse.json(newProject[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
