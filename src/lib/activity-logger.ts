import { db } from '@/db';
import { activities, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface LogActivityParams {
  action: 'created' | 'deleted' | 'updated' | 'stage-changed' | 'description-added' | 'description-updated' | 'description-deleted';
  entityType: 'lead' | 'pipeline' | 'comment' | 'project';
  entityId: number;
  entityName?: string;
  description: string;
  metadata?: Record<string, any>;
  userId?: number;
  leadId?: number;
}

export async function logActivity(params: LogActivityParams) {
  try {
    const {
      action,
      entityType,
      entityId,
      entityName,
      description,
      metadata,
      userId,
      leadId,
    } = params;

    // Fetch user details if userId provided
    let userName: string | null = null;
    let userEmail: string | null = null;

    if (userId) {
      const userResult = await db
        .select({ name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (userResult.length > 0) {
        userName = userResult[0].name;
        userEmail = userResult[0].email;
      }
    }

    await db.insert(activities).values({
      action,
      entityType,
      entityId,
      entityName: entityName || null,
      description,
      metadata: metadata ? JSON.stringify(metadata) : null,
      userName,
      userEmail,
      userId: userId || null,
      leadId: leadId || null,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
    // Don't throw - activity logging should not break main operations
  }
}
