import { supabase } from './supabase';

// Deriva un prefijo corto del nombre del proyecto (sin acentos, primera
// palabra alfanumérica, máx. 5 caracteres). El contrato solo exige el
// formato PREFIJO-N (ver database-schema.yaml); el algoritmo es decisión
// de implementación, no viene especificado.
function buildPrefix(projectName: string): string {
  const normalized = projectName
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase();

  const firstWord = normalized.split(/\s+/).find((w) => /[A-Z0-9]/.test(w)) ?? '';
  const cleaned = firstWord.replace(/[^A-Z0-9]/g, '').slice(0, 5);

  return cleaned || 'TCK';
}

export async function generateTicketKey(
  projectId: string,
  projectName: string,
  attemptOffset = 0,
): Promise<string> {
  const prefix = buildPrefix(projectName);

  const { count, error } = await supabase
    .from('tickets')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', projectId);

  if (error) throw error;

  return `${prefix}-${(count ?? 0) + 1 + attemptOffset}`;
}
