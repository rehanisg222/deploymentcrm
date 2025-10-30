import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { settings } from '@/db/schema';
import { eq, like, desc } from 'drizzle-orm';

// Helper function to validate URL
function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// Helper function to validate JSON object
function isValidJsonObject(value: any): boolean {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Helper function to validate JSON array
function isValidJsonArray(value: any): boolean {
  return Array.isArray(value);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single record fetch
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const record = await db
        .select()
        .from(settings)
        .where(eq(settings.id, parseInt(id)))
        .limit(1);

      if (record.length === 0) {
        return NextResponse.json(
          { error: 'Settings not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      // Parse JSON fields before returning
      const parsedRecord = {
        ...record[0],
        emailIntegrations: record[0].emailIntegrations
          ? JSON.parse(record[0].emailIntegrations as string)
          : null,
        smsIntegrations: record[0].smsIntegrations
          ? JSON.parse(record[0].smsIntegrations as string)
          : null,
        calendarSync: record[0].calendarSync
          ? JSON.parse(record[0].calendarSync as string)
          : null,
        webhooks: record[0].webhooks
          ? JSON.parse(record[0].webhooks as string)
          : null,
        customFields: record[0].customFields
          ? JSON.parse(record[0].customFields as string)
          : null,
      };

      return NextResponse.json(parsedRecord, { status: 200 });
    }

    // List with pagination
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    const results = await db
      .select()
      .from(settings)
      .orderBy(desc(settings.createdAt))
      .limit(limit)
      .offset(offset);

    // Parse JSON fields for all records
    const parsedResults = results.map((record) => ({
      ...record,
      emailIntegrations: record.emailIntegrations
        ? JSON.parse(record.emailIntegrations as string)
        : null,
      smsIntegrations: record.smsIntegrations
        ? JSON.parse(record.smsIntegrations as string)
        : null,
      calendarSync: record.calendarSync
        ? JSON.parse(record.calendarSync as string)
        : null,
      webhooks: record.webhooks ? JSON.parse(record.webhooks as string) : null,
      customFields: record.customFields
        ? JSON.parse(record.customFields as string)
        : null,
    }));

    return NextResponse.json(parsedResults, { status: 200 });
  } catch (error: any) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.organizationName || body.organizationName.trim() === '') {
      return NextResponse.json(
        {
          error: 'Organization name is required',
          code: 'MISSING_ORGANIZATION_NAME',
        },
        { status: 400 }
      );
    }

    if (!body.timezone || body.timezone.trim() === '') {
      return NextResponse.json(
        { error: 'Timezone is required', code: 'MISSING_TIMEZONE' },
        { status: 400 }
      );
    }

    if (!body.currency || body.currency.trim() === '') {
      return NextResponse.json(
        { error: 'Currency is required', code: 'MISSING_CURRENCY' },
        { status: 400 }
      );
    }

    // Sanitize required fields
    const organizationName = body.organizationName.trim();
    const timezone = body.timezone.trim();
    const currency = body.currency.trim();

    // Validate logo URL if provided
    if (body.logo && !isValidUrl(body.logo)) {
      return NextResponse.json(
        { error: 'Invalid logo URL format', code: 'INVALID_LOGO_URL' },
        { status: 400 }
      );
    }

    // Validate emailIntegrations if provided
    if (
      body.emailIntegrations !== undefined &&
      body.emailIntegrations !== null &&
      !isValidJsonObject(body.emailIntegrations)
    ) {
      return NextResponse.json(
        {
          error: 'Email integrations must be a valid JSON object',
          code: 'INVALID_EMAIL_INTEGRATIONS',
        },
        { status: 400 }
      );
    }

    // Validate smsIntegrations if provided
    if (
      body.smsIntegrations !== undefined &&
      body.smsIntegrations !== null &&
      !isValidJsonObject(body.smsIntegrations)
    ) {
      return NextResponse.json(
        {
          error: 'SMS integrations must be a valid JSON object',
          code: 'INVALID_SMS_INTEGRATIONS',
        },
        { status: 400 }
      );
    }

    // Validate calendarSync if provided
    if (
      body.calendarSync !== undefined &&
      body.calendarSync !== null &&
      !isValidJsonObject(body.calendarSync)
    ) {
      return NextResponse.json(
        {
          error: 'Calendar sync must be a valid JSON object',
          code: 'INVALID_CALENDAR_SYNC',
        },
        { status: 400 }
      );
    }

    // Validate webhooks if provided
    if (
      body.webhooks !== undefined &&
      body.webhooks !== null &&
      !isValidJsonArray(body.webhooks)
    ) {
      return NextResponse.json(
        {
          error: 'Webhooks must be a valid JSON array',
          code: 'INVALID_WEBHOOKS',
        },
        { status: 400 }
      );
    }

    // Validate customFields if provided
    if (
      body.customFields !== undefined &&
      body.customFields !== null &&
      !isValidJsonArray(body.customFields)
    ) {
      return NextResponse.json(
        {
          error: 'Custom fields must be a valid JSON array',
          code: 'INVALID_CUSTOM_FIELDS',
        },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Prepare insert data
    const insertData: any = {
      organizationName,
      timezone,
      currency,
      logo: body.logo?.trim() || null,
      emailIntegrations: body.emailIntegrations
        ? JSON.stringify(body.emailIntegrations)
        : null,
      smsIntegrations: body.smsIntegrations
        ? JSON.stringify(body.smsIntegrations)
        : null,
      calendarSync: body.calendarSync ? JSON.stringify(body.calendarSync) : null,
      webhooks: body.webhooks ? JSON.stringify(body.webhooks) : null,
      customFields: body.customFields ? JSON.stringify(body.customFields) : null,
      createdAt: now,
      updatedAt: now,
    };

    const newRecord = await db.insert(settings).values(insertData).returning();

    // Parse JSON fields before returning
    const parsedRecord = {
      ...newRecord[0],
      emailIntegrations: newRecord[0].emailIntegrations
        ? JSON.parse(newRecord[0].emailIntegrations as string)
        : null,
      smsIntegrations: newRecord[0].smsIntegrations
        ? JSON.parse(newRecord[0].smsIntegrations as string)
        : null,
      calendarSync: newRecord[0].calendarSync
        ? JSON.parse(newRecord[0].calendarSync as string)
        : null,
      webhooks: newRecord[0].webhooks
        ? JSON.parse(newRecord[0].webhooks as string)
        : null,
      customFields: newRecord[0].customFields
        ? JSON.parse(newRecord[0].customFields as string)
        : null,
    };

    return NextResponse.json(parsedRecord, { status: 201 });
  } catch (error: any) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if record exists
    const existing = await db
      .select()
      .from(settings)
      .where(eq(settings.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Settings not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const updates: any = {};

    // Validate and sanitize organizationName if provided
    if (body.organizationName !== undefined) {
      if (body.organizationName.trim() === '') {
        return NextResponse.json(
          {
            error: 'Organization name cannot be empty',
            code: 'EMPTY_ORGANIZATION_NAME',
          },
          { status: 400 }
        );
      }
      updates.organizationName = body.organizationName.trim();
    }

    // Validate and sanitize timezone if provided
    if (body.timezone !== undefined) {
      if (body.timezone.trim() === '') {
        return NextResponse.json(
          { error: 'Timezone cannot be empty', code: 'EMPTY_TIMEZONE' },
          { status: 400 }
        );
      }
      updates.timezone = body.timezone.trim();
    }

    // Validate and sanitize currency if provided
    if (body.currency !== undefined) {
      if (body.currency.trim() === '') {
        return NextResponse.json(
          { error: 'Currency cannot be empty', code: 'EMPTY_CURRENCY' },
          { status: 400 }
        );
      }
      updates.currency = body.currency.trim();
    }

    // Validate logo URL if provided
    if (body.logo !== undefined) {
      if (body.logo && !isValidUrl(body.logo)) {
        return NextResponse.json(
          { error: 'Invalid logo URL format', code: 'INVALID_LOGO_URL' },
          { status: 400 }
        );
      }
      updates.logo = body.logo?.trim() || null;
    }

    // Validate emailIntegrations if provided
    if (body.emailIntegrations !== undefined) {
      if (
        body.emailIntegrations !== null &&
        !isValidJsonObject(body.emailIntegrations)
      ) {
        return NextResponse.json(
          {
            error: 'Email integrations must be a valid JSON object',
            code: 'INVALID_EMAIL_INTEGRATIONS',
          },
          { status: 400 }
        );
      }
      updates.emailIntegrations = body.emailIntegrations
        ? JSON.stringify(body.emailIntegrations)
        : null;
    }

    // Validate smsIntegrations if provided
    if (body.smsIntegrations !== undefined) {
      if (
        body.smsIntegrations !== null &&
        !isValidJsonObject(body.smsIntegrations)
      ) {
        return NextResponse.json(
          {
            error: 'SMS integrations must be a valid JSON object',
            code: 'INVALID_SMS_INTEGRATIONS',
          },
          { status: 400 }
        );
      }
      updates.smsIntegrations = body.smsIntegrations
        ? JSON.stringify(body.smsIntegrations)
        : null;
    }

    // Validate calendarSync if provided
    if (body.calendarSync !== undefined) {
      if (body.calendarSync !== null && !isValidJsonObject(body.calendarSync)) {
        return NextResponse.json(
          {
            error: 'Calendar sync must be a valid JSON object',
            code: 'INVALID_CALENDAR_SYNC',
          },
          { status: 400 }
        );
      }
      updates.calendarSync = body.calendarSync
        ? JSON.stringify(body.calendarSync)
        : null;
    }

    // Validate webhooks if provided
    if (body.webhooks !== undefined) {
      if (body.webhooks !== null && !isValidJsonArray(body.webhooks)) {
        return NextResponse.json(
          {
            error: 'Webhooks must be a valid JSON array',
            code: 'INVALID_WEBHOOKS',
          },
          { status: 400 }
        );
      }
      updates.webhooks = body.webhooks ? JSON.stringify(body.webhooks) : null;
    }

    // Validate customFields if provided
    if (body.customFields !== undefined) {
      if (body.customFields !== null && !isValidJsonArray(body.customFields)) {
        return NextResponse.json(
          {
            error: 'Custom fields must be a valid JSON array',
            code: 'INVALID_CUSTOM_FIELDS',
          },
          { status: 400 }
        );
      }
      updates.customFields = body.customFields
        ? JSON.stringify(body.customFields)
        : null;
    }

    // Always update updatedAt
    updates.updatedAt = new Date().toISOString();

    const updated = await db
      .update(settings)
      .set(updates)
      .where(eq(settings.id, parseInt(id)))
      .returning();

    // Parse JSON fields before returning
    const parsedRecord = {
      ...updated[0],
      emailIntegrations: updated[0].emailIntegrations
        ? JSON.parse(updated[0].emailIntegrations as string)
        : null,
      smsIntegrations: updated[0].smsIntegrations
        ? JSON.parse(updated[0].smsIntegrations as string)
        : null,
      calendarSync: updated[0].calendarSync
        ? JSON.parse(updated[0].calendarSync as string)
        : null,
      webhooks: updated[0].webhooks
        ? JSON.parse(updated[0].webhooks as string)
        : null,
      customFields: updated[0].customFields
        ? JSON.parse(updated[0].customFields as string)
        : null,
    };

    return NextResponse.json(parsedRecord, { status: 200 });
  } catch (error: any) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if record exists
    const existing = await db
      .select()
      .from(settings)
      .where(eq(settings.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Settings not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(settings)
      .where(eq(settings.id, parseInt(id)))
      .returning();

    // Parse JSON fields before returning
    const parsedRecord = {
      ...deleted[0],
      emailIntegrations: deleted[0].emailIntegrations
        ? JSON.parse(deleted[0].emailIntegrations as string)
        : null,
      smsIntegrations: deleted[0].smsIntegrations
        ? JSON.parse(deleted[0].smsIntegrations as string)
        : null,
      calendarSync: deleted[0].calendarSync
        ? JSON.parse(deleted[0].calendarSync as string)
        : null,
      webhooks: deleted[0].webhooks
        ? JSON.parse(deleted[0].webhooks as string)
        : null,
      customFields: deleted[0].customFields
        ? JSON.parse(deleted[0].customFields as string)
        : null,
    };

    return NextResponse.json(
      {
        message: 'Settings deleted successfully',
        deleted: parsedRecord,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}