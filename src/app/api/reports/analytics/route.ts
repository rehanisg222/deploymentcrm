import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { leads, brokers, users } from '@/db/schema';
import { eq, and, gte, lte, isNotNull, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateRangeParam = searchParams.get('dateRange') ?? 'all-time';

    // Validate dateRange parameter
    const validDateRanges = ['last-7-days', 'last-30-days', 'last-90-days', 'last-year', 'all-time'];
    if (!validDateRanges.includes(dateRangeParam)) {
      return NextResponse.json(
        {
          error: 'Invalid dateRange parameter',
          code: 'INVALID_DATE_RANGE'
        },
        { status: 400 }
      );
    }

    // Calculate date range
    const now = new Date();
    let startDate: string | null = null;
    const endDate = now.toISOString();

    switch (dateRangeParam) {
      case 'last-7-days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case 'last-30-days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case 'last-90-days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case 'last-year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case 'all-time':
        startDate = null;
        break;
    }

    // Build date filter condition
    const dateFilter = startDate
      ? and(gte(leads.createdAt, startDate), lte(leads.createdAt, endDate))
      : undefined;

    // 1. TOTAL LEADS COUNT
    const totalLeadsResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(leads)
      .where(dateFilter);
    const totalLeads = Number(totalLeadsResult[0]?.count ?? 0);

    // 2. CONVERSION RATE
    const closedWonResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(leads)
      .where(
        dateFilter
          ? and(dateFilter, eq(leads.stage, 'closed won'))
          : eq(leads.stage, 'closed won')
      );
    const closedWonCount = Number(closedWonResult[0]?.count ?? 0);
    const conversionRate = totalLeads > 0 ? parseFloat(((closedWonCount / totalLeads) * 100).toFixed(2)) : 0;

    // 3. TOTAL BROKER REVENUE
    const brokersResult = await db
      .select({
        totalRevenue: brokers.totalRevenue
      })
      .from(brokers);
    
    const totalBrokerRevenue = brokersResult.reduce((sum, broker) => {
      const revenue = parseFloat(broker.totalRevenue || '0');
      return sum + (isNaN(revenue) ? 0 : revenue);
    }, 0);

    // 4. LEADS OVER TIME (Last 6 months) - WITH STAGE BREAKDOWN
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const sixMonthsFilter = and(
      gte(leads.createdAt, sixMonthsAgo.toISOString()),
      dateFilter ? lte(leads.createdAt, endDate) : undefined
    );

    const leadsOverTimeRaw = await db
      .select({
        month: sql<string>`strftime('%Y-%m', ${leads.createdAt})`,
        totalLeads: sql<number>`COUNT(*)`,
        qualified: sql<number>`SUM(CASE WHEN ${leads.stage} = 'qualified' THEN 1 ELSE 0 END)`,
        closed: sql<number>`SUM(CASE WHEN ${leads.stage} = 'closed won' THEN 1 ELSE 0 END)`,
        conversions: sql<number>`SUM(CASE WHEN ${leads.stage} = 'closed won' THEN 1 ELSE 0 END)`
      })
      .from(leads)
      .where(sixMonthsFilter)
      .groupBy(sql`strftime('%Y-%m', ${leads.createdAt})`)
      .orderBy(sql`strftime('%Y-%m', ${leads.createdAt})`);

    // Fill missing months with zeros
    const leadsOverTime = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const existing = leadsOverTimeRaw.find(item => item.month === monthKey);
      leadsOverTime.push({
        month: monthKey,
        totalLeads: existing ? Number(existing.totalLeads) : 0,
        qualified: existing ? Number(existing.qualified) : 0,
        closed: existing ? Number(existing.closed) : 0,
        conversions: existing ? Number(existing.conversions) : 0
      });
    }

    // 5. WEEKLY BREAKDOWN (Last 4 weeks)
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
    
    const weeklyDataRaw = await db
      .select({
        week: sql<string>`strftime('%Y-%W', ${leads.createdAt})`,
        leads: sql<number>`COUNT(*)`,
        conversions: sql<number>`SUM(CASE WHEN ${leads.stage} = 'closed won' THEN 1 ELSE 0 END)`
      })
      .from(leads)
      .where(gte(leads.createdAt, fourWeeksAgo.toISOString()))
      .groupBy(sql`strftime('%Y-%W', ${leads.createdAt})`)
      .orderBy(sql`strftime('%Y-%W', ${leads.createdAt})`);

    // Format weekly data with week labels
    const weeklyData = weeklyDataRaw.map((item, index) => ({
      week: `Week ${index + 1}`,
      leads: Number(item.leads),
      conversions: Number(item.conversions)
    }));

    // 6. SOURCE PERFORMANCE
    const sourcePerformanceRaw = await db
      .select({
        source: leads.source,
        totalLeads: sql<number>`COUNT(*)`,
        conversions: sql<number>`SUM(CASE WHEN ${leads.stage} = 'closed won' THEN 1 ELSE 0 END)`
      })
      .from(leads)
      .where(dateFilter)
      .groupBy(leads.source);

    const sourcePerformance = sourcePerformanceRaw.map(item => ({
      source: item.source || 'unknown',
      totalLeads: Number(item.totalLeads),
      conversions: Number(item.conversions),
      conversionRate: Number(item.totalLeads) > 0 
        ? parseFloat(((Number(item.conversions) / Number(item.totalLeads)) * 100).toFixed(2))
        : 0
    }));

    // 7. BROKER PERFORMANCE
    const brokerPerformanceRaw = await db
      .select({
        brokerId: users.id,
        brokerName: users.name,
        totalLeads: sql<number>`COUNT(${leads.id})`,
        attemptedLeads: sql<number>`SUM(CASE WHEN ${leads.lastContactedAt} IS NOT NULL THEN 1 ELSE 0 END)`,
        closedLeads: sql<number>`SUM(CASE WHEN ${leads.stage} = 'closed won' THEN 1 ELSE 0 END)`
      })
      .from(users)
      .leftJoin(leads, and(
        eq(leads.assignedTo, users.id),
        dateFilter ? dateFilter : undefined
      ))
      .groupBy(users.id, users.name)
      .having(sql`COUNT(${leads.id}) > 0`)
      .orderBy(sql`COUNT(${leads.id}) DESC`);

    const brokerPerformance = brokerPerformanceRaw.map(item => ({
      brokerId: item.brokerId,
      brokerName: item.brokerName,
      totalLeads: Number(item.totalLeads),
      attemptedLeads: Number(item.attemptedLeads),
      closedLeads: Number(item.closedLeads),
      attemptRate: Number(item.totalLeads) > 0
        ? parseFloat(((Number(item.attemptedLeads) / Number(item.totalLeads)) * 100).toFixed(2))
        : 0
    }));

    // 8. CONVERSION FUNNEL
    const stageOrder = ['new', 'contacted', 'qualified', 'negotiation', 'closed won'];
    
    const conversionFunnelRaw = await db
      .select({
        stage: leads.stage,
        count: sql<number>`COUNT(*)`
      })
      .from(leads)
      .where(dateFilter)
      .groupBy(leads.stage);

    const conversionFunnel = stageOrder.map(stage => {
      const existing = conversionFunnelRaw.find(item => item.stage === stage);
      const count = existing ? Number(existing.count) : 0;
      return {
        stage,
        count,
        percentage: totalLeads > 0 
          ? parseFloat(((count / totalLeads) * 100).toFixed(2))
          : 0
      };
    });

    // Build response
    const response = {
      summary: {
        totalLeads,
        conversionRate,
        totalRevenue: totalBrokerRevenue,
        totalBrokerRevenue
      },
      leadsOverTime,
      weeklyData,
      sourcePerformance,
      brokerPerformance,
      conversionFunnel,
      dateRange: {
        startDate: startDate || 'all-time',
        endDate,
        type: dateRangeParam
      }
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_SERVER_ERROR'
      },
      { status: 500 }
    );
  }
}