-- Vendly chat/support schema additions
-- Run this in the Supabase SQL editor before using the new support chat,
-- admin room, and attachment features.

alter table if exists public.messages
  add column if not exists attachment_url text,
  add column if not exists attachment_name text,
  add column if not exists attachment_type text;

alter table if exists public.chat_messages
  add column if not exists attachment_url text,
  add column if not exists attachment_name text,
  add column if not exists attachment_type text;

alter table if exists public.support_tickets
  add column if not exists title text,
  add column if not exists priority text default 'normal',
  add column if not exists assigned_admin_id uuid references public.users(id) on delete set null,
  add column if not exists related_message_id uuid,
  add column if not exists updated_at timestamptz default now();

alter table if exists public.chat_sessions
  add column if not exists session_type text default 'support',
  add column if not exists title text,
  add column if not exists updated_at timestamptz default now();

update public.support_tickets
set status = 'not_taken'
where coalesce(status, '') in ('', 'open');

update public.support_tickets
set status = 'done'
where status = 'resolved';

-- Optional but recommended: keep status values consistent.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'support_tickets_status_check'
  ) then
    alter table public.support_tickets
      add constraint support_tickets_status_check
      check (status in ('not_taken', 'in_progress', 'done', 'open', 'resolved'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'chat_sessions_session_type_check'
  ) then
    alter table public.chat_sessions
      add constraint chat_sessions_session_type_check
      check (session_type in ('support', 'admin_room', 'dispute'));
  end if;
end $$;

create index if not exists idx_support_tickets_assigned_admin_id on public.support_tickets (assigned_admin_id);
create index if not exists idx_support_tickets_status on public.support_tickets (status);
create index if not exists idx_chat_sessions_ticket_id on public.chat_sessions (ticket_id);
create index if not exists idx_chat_sessions_session_type on public.chat_sessions (session_type);
create index if not exists idx_messages_conversation_created_at on public.messages (conversation_id, created_at);
create index if not exists idx_chat_messages_session_created_at on public.chat_messages (session_id, created_at);

-- If you use RLS, make sure admins can read/write support tickets, chat_sessions,
-- and chat_messages for support/admin_room entries, and users can only access
-- their own support tickets plus sessions/messages linked to their own user_id.
