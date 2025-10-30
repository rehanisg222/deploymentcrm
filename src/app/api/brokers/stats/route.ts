import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { brokers, leads } from '@/db/schema';
import { eq, like, or, sql, isNotNull, and, ne } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');

    // Build the base query with LEFT JOIN to include brokers with zero leads
    let query = db
      .select({
        id: brokers.id,
        name: brokers.name,
        email: brokers.email,
        phone: brokers.phone,
        isActive: brokers.isActive,
        attempted1: sql<number>`SUM(CASE WHEN ${leads.stage} = 'attempted 1' THEN 1 ELSE 0 END)`.as('attempted1'),
        attempted2: sql<number>`SUM(CASE WHEN ${leads.stage} = 'attempted 2' THEN 1 ELSE 0 END)`.as('attempted2'),
        unqualified: sql<number>`SUM(CASE WHEN ${leads.stage} = 'unqualified' THEN 1 ELSE 0 END)`.as('unqualified'),
        deadLead: sql<number>`SUM(CASE WHEN ${leads.status} = 'dead lead' THEN 1 ELSE 0 END)`.as('deadLead'),
        siteVisited: sql<number>`SUM(CASE WHEN ${leads.stage} = 'site visited' THEN 1 ELSE 0 END)`.as('siteVisited'),
        followUp: sql<number>`SUM(CASE WHEN ${leads.followUp} IS NOT NULL AND ${leads.followUp} != '' THEN 1 ELSE 0 END)`.as('followUp'),
        totalLeads: sql<number>`COUNT(${leads.id})`.as('totalLeads'),
      })
      .from(brokers)
      .leftJoin(leads, eq(leads.brokerId, brokers.id))
      .groupBy(brokers.id, brokers.name, brokers.email, brokers.phone, brokers.isActive)
      .orderBy(brokers.name);

    // Apply search filter if provided
    if (search) {
      const searchTerm = `%${search}%`;
      query = query.where(
        or(
          like(brokers.name, searchTerm),
          like(brokers.email, searchTerm)
        )
      ) as typeof query;
    }

    const results = await query;

    // Map results with correct totals
    const brokerStats = results.map((broker) => ({
      id: broker.id,
      name: broker.name,
      email: broker.email,
      phone: broker.phone,
      isActive: broker.isActive,
      attempted1: broker.attempted1 || 0,
      attempted2: broker.attempted2 || 0,
      unqualified: broker.unqualified || 0,
      deadLead: broker.deadLead || 0,
      siteVisited: broker.siteVisited || 0,
      followUp: broker.followUp || 0,
      totalLeads: broker.totalLeads || 0,
    }));

    return NextResponse.json(brokerStats, { status: 200 });
  } catch (error) {
    console.error('GET broker statistics error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}