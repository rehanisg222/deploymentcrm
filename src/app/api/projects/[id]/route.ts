import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, type, location, developer, price, status, units, amenities, images, description } = body;

    if (!name || !type || !location || !developer || !price) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const updatedProject = await db.update(projects)
      .set({
        name,
        type,
        location,
        developer,
        price,
        status,
        units: units ? JSON.stringify(units) : null,
        amenities: amenities ? JSON.stringify(amenities) : null,
        images: images ? JSON.stringify(images) : null,
        description,
        updatedAt: new Date().toISOString()
      })
      .where(eq(projects.id, parseInt(id)))
      .returning();

    if (updatedProject.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json(updatedProject[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const deletedProject = await db.delete(projects)
      .where(eq(projects.id, parseInt(id)))
      .returning();

    if (deletedProject.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
