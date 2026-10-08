import { supabase } from './supabase';

type ProjectRow = {
  id: string;
  name: string;
  description: string | null;
  creator_id: string;
  created_at: string;
};

export type ProjectDTO = {
  id: string;
  name: string;
  description: string | null;
  creatorId: string;
  memberIds: string[];
  ticketCount: number;
};

export async function attachProjectRelations(rows: ProjectRow[]): Promise<ProjectDTO[]> {
  if (rows.length === 0) return [];

  const projectIds = rows.map((r) => r.id);

  const [{ data: members, error: membersError }, { data: openTickets, error: ticketsError }] =
    await Promise.all([
      supabase.from('project_members').select('project_id, user_id').in('project_id', projectIds),
      supabase
        .from('tickets')
        .select('project_id')
        .in('project_id', projectIds)
        .is('archived_at', null),
    ]);

  if (membersError) throw membersError;
  if (ticketsError) throw ticketsError;

  const memberIdsByProject = new Map<string, string[]>();
  for (const m of members ?? []) {
    const list = memberIdsByProject.get(m.project_id) ?? [];
    list.push(m.user_id);
    memberIdsByProject.set(m.project_id, list);
  }

  const ticketCountByProject = new Map<string, number>();
  for (const t of openTickets ?? []) {
    ticketCountByProject.set(t.project_id, (ticketCountByProject.get(t.project_id) ?? 0) + 1);
  }

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    creatorId: row.creator_id,
    memberIds: memberIdsByProject.get(row.id) ?? [],
    ticketCount: ticketCountByProject.get(row.id) ?? 0,
  }));
}
