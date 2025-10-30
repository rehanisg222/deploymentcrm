import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

// Leads table
export const leads = sqliteTable('leads', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone').notNull(),
  source: text('source').notNull(),
  subSource: text('sub_source'),
  status: text('status').notNull().default('new lead'),
  stage: text('stage').notNull().default('new'),
  budget: text('budget'),
  interestedIn: text('interested_in'),
  projectId: integer('project_id').references(() => projects.id),
  assignedTo: integer('assigned_to'),
  brokerId: integer('broker_id').references(() => brokers.id),
  score: integer('score').default(0),
  tags: text('tags', { mode: 'json' }),
  notes: text('notes'),
  followUp: text('follow_up'),
  lastContactedAt: text('last_contacted_at'),
  nextCallDate: text('next_call_date'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Users table
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  role: text('role').notNull(), // admin/manager/agent
  phone: text('phone'),
  avatar: text('avatar'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  permissions: text('permissions', { mode: 'json' }), // array of permissions
  teamId: integer('team_id'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Projects table
export const projects = sqliteTable('projects', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  type: text('type').notNull(), // residential/commercial
  location: text('location').notNull(),
  developer: text('developer').notNull(),
  price: text('price').notNull(),
  status: text('status').notNull().default('planning'), // planning/under-construction/ready/sold-out
  units: text('units', { mode: 'json' }), // array of units
  amenities: text('amenities', { mode: 'json' }), // array of amenities
  images: text('images', { mode: 'json' }), // array of image URLs
  description: text('description'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Activities table - transformed to audit log
export const activities = sqliteTable('activities', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  leadId: integer('lead_id').references(() => leads.id, { onDelete: 'cascade' }),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(), // created/deleted/updated/stage-changed/description-added/description-updated/description-deleted
  entityType: text('entity_type').notNull(), // lead/pipeline/comment/project
  entityId: integer('entity_id').notNull(),
  entityName: text('entity_name'),
  description: text('description').notNull(),
  metadata: text('metadata', { mode: 'json' }), // stores context like {"from": "new", "to": "contacted"}
  userName: text('user_name'),
  userEmail: text('user_email'),
  createdAt: text('created_at').notNull(),
});

// Campaigns table
export const campaigns = sqliteTable('campaigns', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  type: text('type').notNull(), // email/sms/social
  status: text('status').notNull().default('draft'), // draft/active/paused/completed
  budget: text('budget'),
  spent: text('spent').default('0'),
  leads: text('leads', { mode: 'json' }), // array of lead IDs
  conversions: integer('conversions').default(0),
  startDate: text('start_date'),
  endDate: text('end_date'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Brokers table
export const brokers = sqliteTable('brokers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  company: text('company').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone').notNull(),
  commission: text('commission'),
  totalDeals: integer('total_deals').default(0),
  totalRevenue: text('total_revenue').default('0'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  joinedAt: text('joined_at').notNull(),
});

// Settings table
export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  organizationName: text('organization_name').notNull(),
  logo: text('logo'),
  timezone: text('timezone').notNull(),
  currency: text('currency').notNull(),
  emailIntegrations: text('email_integrations', { mode: 'json' }), // smtp settings object
  smsIntegrations: text('sms_integrations', { mode: 'json' }),
  calendarSync: text('calendar_sync', { mode: 'json' }),
  webhooks: text('webhooks', { mode: 'json' }), // array of webhooks
  customFields: text('custom_fields', { mode: 'json' }), // array of custom fields
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Lead Comments table
export const leadComments = sqliteTable('lead_comments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  leadId: integer('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),
  userId: integer('user_id'),
  description: text('description').notNull(),
  createdAt: text('created_at').notNull(),
});


// Auth tables for better-auth
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  role: text("role").notNull().default("admin"), // admin or broker
  brokerId: integer("broker_id").references(() => brokers.id),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});