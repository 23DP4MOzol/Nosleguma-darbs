import { supabase } from './supabase.js';

const AUDIT_TABLE = 'audit_logs';

export async function logAuditEvent(eventType, eventData = {}, extra = {}) {
  try {
    if (!eventType) return;

    let actorUserId = extra.actorUserId || null;
    let actorEmail = extra.actorEmail || null;

    if (!actorUserId || !actorEmail) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        actorUserId = actorUserId || user?.id || null;
        actorEmail = actorEmail || user?.email || null;
      } catch (e) {
        // ignore
      }
    }

    const payload = {
      event_type: String(eventType),
      event_data: eventData && typeof eventData === 'object' ? eventData : { value: eventData },
      actor_user_id: actorUserId,
      actor_email: actorEmail,
      page_path: extra.pagePath || (typeof window !== 'undefined' ? window.location.pathname : null),
      user_agent: (typeof navigator !== 'undefined' ? navigator.userAgent : null)
    };

    // Remove undefined fields (PostgREST dislikes them)
    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

    await supabase.from(AUDIT_TABLE).insert(payload);
  } catch (e) {
    // Best-effort only
  }
}

export async function fetchAuditLogs({ days = 14, limit = 200 } = {}) {
  const since = new Date(Date.now() - (days * 24 * 60 * 60 * 1000)).toISOString();
  const { data, error } = await supabase
    .from(AUDIT_TABLE)
    .select('id, created_at, event_type, actor_email, actor_user_id, page_path, event_data')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function purgeAuditLogsOlderThan({ days = 14 } = {}) {
  const before = new Date(Date.now() - (days * 24 * 60 * 60 * 1000)).toISOString();
  const { error } = await supabase.from(AUDIT_TABLE).delete().lt('created_at', before);
  if (error) throw error;
  return true;
}
