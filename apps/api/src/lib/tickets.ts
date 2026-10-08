import { supabase } from './supabase';

export type TicketRow = {
  id: string;
  key: string;
  project_id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'high' | 'medium' | 'low';
  creator_id: string;
  due_date: string | null;
  archived_at: string | null;
};

export type TicketDTO = {
  id: string;
  key: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TicketRow['status'];
  priority: TicketRow['priority'];
  assigneeIds: string[];
  creatorId: string;
  tags: string[];
  dueDate: string | null;
  archived: boolean;
};

export async function attachTicketRelations(rows: TicketRow[]): Promise<TicketDTO[]> {
  if (rows.length === 0) return [];

  const ticketIds = rows.map((r) => r.id);

  const [
    { data: assignees, error: assigneesError },
    { data: ticketTags, error: ticketTagsError },
  ] = await Promise.all([
    supabase.from('ticket_assignees').select('ticket_id, user_id').in('ticket_id', ticketIds),
    supabase.from('ticket_tags').select('ticket_id, tag_id').in('ticket_id', ticketIds),
  ]);

  if (assigneesError) throw assigneesError;
  if (ticketTagsError) throw ticketTagsError;

  const tagIds = [...new Set((ticketTags ?? []).map((t) => t.tag_id))];
  const { data: tags, error: tagsError } =
    tagIds.length > 0
      ? await supabase.from('tags').select('id, name').in('id', tagIds)
      : { data: [] as { id: string; name: string }[], error: null };

  if (tagsError) throw tagsError;

  const assigneeIdsByTicket = new Map<string, string[]>();
  for (const a of assignees ?? []) {
    const list = assigneeIdsByTicket.get(a.ticket_id) ?? [];
    list.push(a.user_id);
    assigneeIdsByTicket.set(a.ticket_id, list);
  }

  const tagNameById = new Map((tags ?? []).map((t) => [t.id, t.name]));
  const tagsByTicket = new Map<string, string[]>();
  for (const t of ticketTags ?? []) {
    const tagName = tagNameById.get(t.tag_id);
    if (!tagName) continue;
    const list = tagsByTicket.get(t.ticket_id) ?? [];
    list.push(tagName);
    tagsByTicket.set(t.ticket_id, list);
  }

  return rows.map((row) => ({
    id: row.id,
    key: row.key,
    projectId: row.project_id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    assigneeIds: assigneeIdsByTicket.get(row.id) ?? [],
    creatorId: row.creator_id,
    tags: tagsByTicket.get(row.id) ?? [],
    dueDate: row.due_date,
    archived: row.archived_at !== null,
  }));
}
