create extension if not exists pgcrypto;

do $$
begin
  create type incident_severity as enum ('SEV-1', 'SEV-2', 'SEV-3');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type incident_environment as enum ('production', 'staging', 'sandbox');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type incident_status as enum ('detected', 'investigating', 'mitigating', 'resolved', 'closed');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type incident_event_type as enum ('signal', 'status_change', 'mitigation', 'vendor_update', 'analysis', 'resolution');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type analysis_run_status as enum ('queued', 'running', 'completed', 'failed');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.vendors (
  id text primary key,
  name text not null unique,
  category text not null,
  status_page_url text,
  escalation_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.incidents (
  id text primary key,
  title text not null,
  vendor_id text not null references public.vendors(id),
  vendor text not null,
  service text not null,
  severity incident_severity not null,
  environment incident_environment not null default 'production',
  region text not null,
  status incident_status not null,
  triggered_at timestamptz not null,
  resolved_at timestamptz,
  ttd_seconds integer not null check (ttd_seconds >= 0),
  ttr_seconds integer check (ttr_seconds is null or ttr_seconds >= 0),
  description text not null,
  signals text[] not null default '{}',
  tags text[] not null default '{}',
  root_cause text,
  resolution text,
  skipped_checks text[] not null default '{}',
  patterns_matched text[] not null default '{}',
  memory_text text generated always as (
    title || ' ' ||
    vendor || ' ' ||
    service || ' ' ||
    severity::text || ' ' ||
    environment::text || ' ' ||
    region || ' ' ||
    description || ' ' ||
    array_to_string(signals, ' ') || ' ' ||
    array_to_string(tags, ' ') || ' ' ||
    coalesce(root_cause, '') || ' ' ||
    coalesce(resolution, '') || ' ' ||
    array_to_string(skipped_checks, ' ') || ' ' ||
    array_to_string(patterns_matched, ' ')
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.incident_events (
  id uuid primary key default gen_random_uuid(),
  incident_id text not null references public.incidents(id) on delete cascade,
  event_type incident_event_type not null,
  occurred_at timestamptz not null,
  title text not null,
  body text not null,
  source text not null check (source in ('kairo', 'monitor', 'human', 'vendor', 'system')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.analysis_runs (
  id uuid primary key default gen_random_uuid(),
  incident_id text not null references public.incidents(id) on delete cascade,
  status analysis_run_status not null default 'queued',
  model text not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  diagnosis text,
  confidence numeric(4,3) check (confidence is null or (confidence >= 0 and confidence <= 1)),
  recommended_actions text[] not null default '{}',
  dead_ends text[] not null default '{}',
  cross_vendor_pattern text,
  uncertainty_note text,
  cited_incident_ids text[] not null default '{}',
  input_snapshot jsonb not null default '{}'::jsonb,
  output_snapshot jsonb not null default '{}'::jsonb
);

create table if not exists public.memory_matches (
  id uuid primary key default gen_random_uuid(),
  incident_id text not null references public.incidents(id) on delete cascade,
  matched_incident_id text not null references public.incidents(id) on delete cascade,
  analysis_run_id uuid references public.analysis_runs(id) on delete set null,
  similarity numeric(6,5) not null check (similarity >= 0 and similarity <= 1),
  rank integer not null check (rank > 0),
  match_reason text not null,
  matched_signals text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (incident_id, matched_incident_id, analysis_run_id)
);

create table if not exists public.resolutions (
  id uuid primary key default gen_random_uuid(),
  incident_id text not null unique references public.incidents(id) on delete cascade,
  resolved_by text not null,
  resolved_at timestamptz not null,
  fix_applied text not null,
  failed_mitigations text[] not null default '{}',
  root_cause text not null,
  pattern_tags text[] not null default '{}',
  time_to_resolve_seconds integer not null check (time_to_resolve_seconds >= 0),
  notes text,
  retained_as_memory boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists incidents_vendor_id_idx on public.incidents(vendor_id);
create index if not exists incidents_status_idx on public.incidents(status);
create index if not exists incidents_triggered_at_idx on public.incidents(triggered_at desc);
create index if not exists incidents_tags_idx on public.incidents using gin(tags);
create index if not exists incidents_signals_idx on public.incidents using gin(signals);
create index if not exists incidents_patterns_matched_idx on public.incidents using gin(patterns_matched);
create index if not exists incident_events_incident_time_idx on public.incident_events(incident_id, occurred_at);
create index if not exists memory_matches_incident_rank_idx on public.memory_matches(incident_id, rank);
create index if not exists analysis_runs_incident_started_idx on public.analysis_runs(incident_id, started_at desc);
