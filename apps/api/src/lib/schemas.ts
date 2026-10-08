import { registry } from './openapi/registry';
import { z } from 'zod';

export const RoleSchema = z.enum(['admin', 'user']).openapi('Role');
export const StatusSchema = z.enum(['todo', 'in-progress', 'review', 'done']).openapi('Status');
export const PrioritySchema = z.enum(['high', 'medium', 'low']).openapi('Priority');
export const AuditActionSchema = z
  .enum(['created', 'updated', 'archived', 'status_changed'])
  .openapi('AuditAction');

export const STATUS_ORDER = ['todo', 'in-progress', 'review', 'done'] as const;

export const UserSchema = registry.register(
  'User',
  z.object({
    id: z.string().uuid(),
    name: z.string(),
    username: z.string(),
    email: z.string().email(),
    role: RoleSchema,
  }),
);

export const ProjectSchema = registry.register(
  'Project',
  z.object({
    id: z.string().uuid(),
    name: z.string(),
    description: z.string().nullable(),
    creatorId: z.string().uuid(),
    memberIds: z.array(z.string().uuid()),
    ticketCount: z.number().int().nonnegative(),
  }),
);

export const TicketSchema = registry.register(
  'Ticket',
  z.object({
    id: z.string().uuid(),
    key: z.string(),
    projectId: z.string().uuid(),
    title: z.string(),
    description: z.string().nullable(),
    status: StatusSchema,
    priority: PrioritySchema,
    assigneeIds: z.array(z.string().uuid()),
    creatorId: z.string().uuid(),
    tags: z.array(z.string()),
    dueDate: z.string().nullable(),
    archived: z.boolean(),
  }),
);

export const CommentSchema = registry.register(
  'Comment',
  z.object({
    id: z.string().uuid(),
    ticketId: z.string().uuid(),
    authorId: z.string().uuid(),
    body: z.string(),
    createdAt: z.string(),
  }),
);

export const AuditEntrySchema = registry.register(
  'AuditEntry',
  z.object({
    id: z.string().uuid(),
    ticketId: z.string().uuid(),
    actorId: z.string().uuid(),
    action: AuditActionSchema,
    changes: z.record(z.unknown()).nullable(),
    createdAt: z.string(),
  }),
);

export const LockSchema = registry.register(
  'Lock',
  z.object({
    ticketId: z.string().uuid(),
    userId: z.string().uuid(),
    createdAt: z.string(),
  }),
);

export const ProblemDetailsSchema = registry.register(
  'ProblemDetails',
  z.object({
    type: z.string(),
    title: z.string(),
    status: z.number().int(),
    detail: z.string(),
    instance: z.string(),
  }),
);

export function envelope<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({ data: dataSchema, error: z.null() });
}

export function paginated<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    page: z.number().int(),
    pageSize: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  });
}

export const PageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).openapi({ example: 1 }),
  pageSize: z.coerce.number().int().min(1).max(100).default(20).openapi({ example: 20 }),
});
