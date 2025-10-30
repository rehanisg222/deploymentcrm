import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user, leads, activities } from '@/db/schema';
import { eq, ne, and, desc, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    // Validate userId is provided
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    // Get user and verify role and brokerId
    const userData = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (userData.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    const currentUser = userData[0];

    if (currentUser.role !== 'broker') {
      return NextResponse.json(
        { error: 'Access denied. User must have broker role', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    if (!currentUser.brokerId) {
      return NextResponse.json(
        { error: 'Access denied. User not linked to a broker', code: 'NO_BROKER_LINK' },
        { status: 403 }
      );
    }

    const linkedBrokerId = currentUser.brokerId;

    // Calculate statistics using SQL aggregation
    const statsResult = await db
      .select({
        totalLeads: sql<number>`COUNT(*)`,
        hotLeads: sql<number>`SUM(CASE WHEN ${leads.status} = 'hot lead' THEN 1 ELSE 0 END)`,
        newLeads: sql<number>`SUM(CASE WHEN ${leads.status} = 'new lead' THEN 1 ELSE 0 END)`,
        closedDeals: sql<number>`SUM(CASE WHEN ${leads.stage} = 'closed won' THEN 1 ELSE 0 END)`,
        activePipeline: sql<number>`SUM(CASE WHEN ${leads.stage} != 'closed won' THEN 1 ELSE 0 END)`,
        stageNew: sql<number>`SUM(CASE WHEN ${leads.stage} = 'new' THEN 1 ELSE 0 END)`,
        stageAttempted1: sql<number>`SUM(CASE WHEN ${leads.stage} = 'attempted 1' THEN 1 ELSE 0 END)`,
        stageAttempted2: sql<number>`SUM(CASE WHEN ${leads.stage} = 'attempted 2' THEN 1 ELSE 0 END)`,
        stageUnqualified: sql<number>`SUM(CASE WHEN ${leads.stage} = 'unqualified' THEN 1 ELSE 0 END)`,
        stageSiteVisited: sql<number>`SUM(CASE WHEN ${leads.stage} = 'site visited' THEN 1 ELSE 0 END)`,
        stageClosedWon: sql<number>`SUM(CASE WHEN ${leads.stage} = 'closed won' THEN 1 ELSE 0 END)`,
        statusHotLead: sql<number>`SUM(CASE WHEN ${leads.status} = 'hot lead' THEN 1 ELSE 0 END)`,
        statusNewLead: sql<number>`SUM(CASE WHEN ${leads.status} = 'new lead' THEN 1 ELSE 0 END)`,
        statusBookedLead: sql<number>`SUM(CASE WHEN ${leads.status} = 'booked lead' THEN 1 ELSE 0 END)`,
        statusDeadLead: sql<number>`SUM(CASE WHEN ${leads.status} = 'dead lead' THEN 1 ELSE 0 END)`,
        statusDuplicateLead: sql<number>`SUM(CASE WHEN ${leads.status} = 'duplicate lead' THEN 1 ELSE 0 END)`,
      })
      .from(leads)
      .where(eq(leads.brokerId, linkedBrokerId));

    const stats = statsResult[0];

    // Get recent activity for the authenticated user (not the broker)
    const recentActivityData = await db
      .select()
      .from(activities)
      .where(eq(activities.userId, parseInt(userId)))
      .orderBy(desc(activities.createdAt))
      .limit(10);

    // Parse metadata JSON if present
    const recentActivity = recentActivityData.map((activity) => ({
      id: activity.id,
      leadId: activity.leadId,
      userId: activity.userId,
      action: activity.action,
      entityType: activity.entityType,
      entityId: activity.entityId,
      entityName: activity.entityName,
      description: activity.description,
      metadata: activity.metadata ? (typeof activity.metadata === 'string' ? JSON.parse(activity.metadata) : activity.metadata) : null,
      userName: activity.userName,
      userEmail: activity.userEmail,
      createdAt: activity.createdAt,
    }));

    // Return comprehensive statistics
    return NextResponse.json(
      {
        brokerId: linkedBrokerId,
        totalLeads: Number(stats.totalLeads) || 0,
        hotLeads: Number(stats.hotLeads) || 0,
        newLeads: Number(stats.newLeads) || 0,
        closedDeals: Number(stats.closedDeals) || 0,
        activePipeline: Number(stats.activePipeline) || 0,
        byStage: {
          new: Number(stats.stageNew) || 0,
          attempted1: Number(stats.stageAttempted1) || 0,
          attempted2: Number(stats.stageAttempted2) || 0,
          unqualified: Number(stats.stageUnqualified) || 0,
          siteVisited: Number(stats.stageSiteVisited) || 0,
          closedWon: Number(stats.stageClosedWon) || 0,
        },
        byStatus: {
          hotLead: Number(stats.statusHotLead) || 0,
          newLead: Number(stats.statusNewLead) || 0,
          bookedLead: Number(stats.statusBookedLead) || 0,
          deadLead: Number(stats.statusDeadLead) || 0,
          duplicateLead: Number(stats.statusDuplicateLead) || 0,
        },
        recentActivity,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/reports/broker-stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}