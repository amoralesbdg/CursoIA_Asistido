import { supabase } from './supabase';

async function fetchTagIdsByName(names: string[]): Promise<Map<string, string>> {
  const { data, error } = await supabase.from('tags').select('id, name').in('name', names);
  if (error) throw error;
  return new Map((data ?? []).map((t) => [t.name, t.id]));
}

// Deduplica y crea (si hace falta) las etiquetas de texto libre, devolviendo
// sus ids en el mismo orden de `uniqueNames` (RF-11: catálogo normalizado).
export async function upsertTagIds(tagNames: string[]): Promise<string[]> {
  const uniqueNames = [...new Set(tagNames.map((t) => t.trim()).filter(Boolean))];
  if (uniqueNames.length === 0) return [];

  let byName = await fetchTagIdsByName(uniqueNames);
  const missing = uniqueNames.filter((n) => !byName.has(n));

  if (missing.length > 0) {
    const { data: inserted, error: insertError } = await supabase
      .from('tags')
      .insert(missing.map((name) => ({ name })))
      .select('id, name');

    if (insertError && insertError.code !== '23505') throw insertError;

    if (insertError) {
      // Carrera con otra inserción concurrente del mismo nombre: releer.
      byName = await fetchTagIdsByName(uniqueNames);
    } else {
      for (const t of inserted ?? []) byName.set(t.name, t.id);
    }
  }

  return uniqueNames.map((n) => byName.get(n)!);
}
