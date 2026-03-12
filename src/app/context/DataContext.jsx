/**
 * DataContext.jsx
 *
 * Drop-in replacement for your existing DataContext.
 * Replaces the in-memory mock data with live Supabase queries.
 *
 * The shape of every `person` object returned to components is
 * IDENTICAL to what your existing Dashboard / PersonDetail expect,
 * so no other files need to change.
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/** Convert a DB row + joins into the flat person object your UI expects */
function rowToPerson(row) {
  return {
    id:              row.id,
    caseId:          row.case_id,
    name:            row.name,
    age:             row.age,
    location:        row.location,
    assignedWorker:  row.workers?.name ?? null,
    riskLevel:       row.risk_level,
    distressScore:   row.distress_score,
    status:          row.status,
    aiSummary:       row.ai_summary,
    lastContact:     row.last_contact,
    // Nested arrays (populated by fetchPersons or fetchPerson)
    socialMediaAccounts: (row.social_media_accounts ?? []).map(a => ({
      platform:    a.platform,
      username:    a.username,
      url:         a.url,
      lastChecked: a.last_checked,
    })),
    notes:        (row.case_notes ?? []).map(n => n.body),
    _notesRaw:    row.case_notes ?? [],          // keep IDs for edit/delete
    distressPosts:(row.distress_posts ?? []).map(p => ({
      id:               p.id,
      platform:         p.platform,
      content:          p.content,
      distressScore:    p.distress_score,
      emotionalIntensity: p.emotional_intensity,
      isConcerning:     p.is_concerning,
      timestamp:        p.timestamp,
    })),
  };
}

/** Convert a DB worker row into a plain string (what the UI uses) */
const rowToWorkerName = (row) => row.name;

// ─────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [persons,  setPersons]  = useState([]);
  const [workers,  setWorkers]  = useState([]);   // array of name strings
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  // ── Fetch all workers ──────────────────────────────────────
  const fetchWorkers = useCallback(async () => {
    const { data, error } = await supabase
      .from('workers')
      .select('id, name')
      .order('name');
    if (error) { console.error(error); return; }
    setWorkers(data.map(rowToWorkerName));
  }, []);

  // ── Fetch all persons (with joins) ────────────────────────
  const fetchPersons = useCallback(async () => {
    const { data, error } = await supabase
      .from('cases')
      .select(`
        *,
        workers ( name ),
        social_media_accounts ( * ),
        case_notes ( * ),
        distress_posts ( * )
      `)
      .order('created_at', { ascending: false });

    if (error) { console.error(error); setError(error.message); return; }
    setPersons(data.map(rowToPerson));
  }, []);

  // ── Bootstrap ─────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchWorkers(), fetchPersons()]);
      setLoading(false);
    })();
  }, [fetchWorkers, fetchPersons]);

  // ── Real-time subscription (optional but nice) ────────────
  useEffect(() => {
    const channel = supabase
      .channel('cases-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cases' }, fetchPersons)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'distress_posts' }, fetchPersons)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'case_notes' }, fetchPersons)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchPersons]);

  // ─────────────────────────────────────────────────────────
  // PERSONS API
  // ─────────────────────────────────────────────────────────

  /** Add a brand-new case (called from Dashboard "Add Case" form) */
  const addPerson = useCallback(async (newPerson) => {
    // 1. Resolve worker name → id
    const { data: workerRows } = await supabase
      .from('workers')
      .select('id')
      .eq('name', newPerson.assignedWorker)
      .single();

    // 2. Insert case row
    const { data: caseRow, error: caseErr } = await supabase
      .from('cases')
      .insert({
        case_id:       newPerson.caseId,
        name:          newPerson.name,
        age:           newPerson.age,
        location:      newPerson.location,
        worker_id:     workerRows?.id ?? null,
        risk_level:    newPerson.riskLevel ?? 'low',
        distress_score: newPerson.distressScore ?? 0,
        status:        'active',
        ai_summary:    newPerson.aiSummary ?? null,
        last_contact:  newPerson.lastContact ?? new Date().toISOString(),
      })
      .select()
      .single();

    if (caseErr) { console.error(caseErr); return; }

    // 3. Insert social media accounts
    if (newPerson.socialMediaAccounts?.length) {
      await supabase.from('social_media_accounts').insert(
        newPerson.socialMediaAccounts.map(a => ({
          case_id:      caseRow.id,
          platform:     a.platform,
          username:     a.username,
          url:          a.url,
          last_checked: a.lastChecked,
        }))
      );
    }

    // 4. Insert default note
    if (newPerson.notes?.length) {
      await supabase.from('case_notes').insert(
        newPerson.notes.map(body => ({ case_id: caseRow.id, body }))
      );
    }

    await fetchPersons();
  }, [fetchPersons]);

  /**
   * Update an existing case.
   * `updates` can contain any subset of the person shape your UI passes.
   */
  const updatePerson = useCallback(async (personId, updates) => {
    const patch = {};

    if ('name'          in updates) patch.name           = updates.name;
    if ('age'           in updates) patch.age            = updates.age;
    if ('location'      in updates) patch.location       = updates.location;
    if ('riskLevel'     in updates) patch.risk_level     = updates.riskLevel;
    if ('distressScore' in updates) patch.distress_score = updates.distressScore;
    if ('status'        in updates) patch.status         = updates.status;
    if ('aiSummary'     in updates) patch.ai_summary     = updates.aiSummary;
    if ('lastContact'   in updates) patch.last_contact   = updates.lastContact;

    // Resolve assignedWorker → worker_id
    if ('assignedWorker' in updates) {
      const { data } = await supabase
        .from('workers')
        .select('id')
        .eq('name', updates.assignedWorker)
        .single();
      patch.worker_id = data?.id ?? null;
    }

    if (Object.keys(patch).length) {
      await supabase.from('cases').update(patch).eq('id', personId);
    }

    // Handle notes array replacement (PersonDetail passes full notes array)
    if (updates.notes) {
      // Delete existing notes then re-insert
      await supabase.from('case_notes').delete().eq('case_id', personId);
      if (updates.notes.length) {
        await supabase.from('case_notes').insert(
          updates.notes.map(body => ({ case_id: personId, body }))
        );
      }
    }

    // Handle social media accounts
    if (updates.socialMediaAccounts) {
      await supabase.from('social_media_accounts').delete().eq('case_id', personId);
      if (updates.socialMediaAccounts.length) {
        await supabase.from('social_media_accounts').insert(
          updates.socialMediaAccounts.map(a => ({
            case_id:      personId,
            platform:     a.platform,
            username:     a.username,
            url:          a.url,
            last_checked: a.lastChecked,
          }))
        );
      }
    }

    await fetchPersons();
  }, [fetchPersons]);

  // ─────────────────────────────────────────────────────────
  // WORKERS API
  // ─────────────────────────────────────────────────────────

  const addWorker = useCallback(async (name) => {
    const { error } = await supabase.from('workers').insert({ name });
    if (error) { console.error(error); return; }
    await fetchWorkers();
  }, [fetchWorkers]);

  const updateWorker = useCallback(async (oldName, newName) => {
    const { data } = await supabase
      .from('workers').select('id').eq('name', oldName).single();
    if (!data) return;
    await supabase.from('workers').update({ name: newName }).eq('id', data.id);
    await Promise.all([fetchWorkers(), fetchPersons()]);
  }, [fetchWorkers, fetchPersons]);

  const deleteWorker = useCallback(async (name) => {
    const { data } = await supabase
      .from('workers').select('id').eq('name', name).single();
    if (!data) return;
    // Cases keep their row; worker_id becomes NULL (on delete set null)
    await supabase.from('workers').delete().eq('id', data.id);
    await Promise.all([fetchWorkers(), fetchPersons()]);
  }, [fetchWorkers, fetchPersons]);

  // ─────────────────────────────────────────────────────────
  // DISTRESS POSTS (written by your Chrome extension)
  // Exposed here so the extension can also call Supabase directly
  // ─────────────────────────────────────────────────────────

  /**
   * Add a distress post from the extension.
   * The extension should call supabase directly, but this helper
   * is here if you want to trigger it from the frontend too.
   */
  const addDistressPost = useCallback(async (caseId, post) => {
    await supabase.from('distress_posts').insert({
      case_id:           caseId,
      platform:          post.platform,
      content:           post.content,
      distress_score:    post.distressScore,
      emotional_intensity: post.emotionalIntensity,
      is_concerning:     post.isConcerning,
      timestamp:         post.timestamp ?? new Date().toISOString(),
    });
    // Real-time subscription will trigger fetchPersons automatically
  }, []);

  return (
    <DataContext.Provider value={{
      persons,
      workers,
      loading,
      error,
      addPerson,
      updatePerson,
      addWorker,
      updateWorker,
      deleteWorker,
      addDistressPost,
      refetch: fetchPersons,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used inside DataProvider');
  return ctx;
}
