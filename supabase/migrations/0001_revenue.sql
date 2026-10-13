create function touch_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
create table customers (
 id uuid primary key default gen_random_uuid(), source_id text not null unique, name text not null check(length(trim(name))>0),
 owner text not null default '', segment text not null default 'Unassigned', purpose text not null default '',
 reviewed_on date, retention_review_on date, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table imports (
 id uuid primary key default gen_random_uuid(), file_name text not null, sha256 text not null, currency text not null check(currency ~ '^[A-Z]{3}$'),
 actor text not null, customer_count integer not null, snapshot_count integer not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table monthly_mrr (
 id uuid primary key default gen_random_uuid(), customer_id uuid not null references customers(id), month date not null,
 currency text not null check(currency ~ '^[A-Z]{3}$'), mrr numeric(18,2) not null check(mrr>=0), import_id uuid references imports(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(customer_id,month),
 check(month=(date_trunc('month',month)+interval '1 month - 1 day')::date)
);
create table actions (
 id uuid primary key default gen_random_uuid(), customer_id uuid not null references customers(id), title text not null check(length(trim(title))>0),
 owner text not null check(length(trim(owner))>0), due_on date not null, status text not null default 'open' check(status in ('open','closed')),
 evidence text, closed_by text, closed_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(status='open' or (length(trim(evidence))>0 and closed_by is not null and closed_at is not null))
);
create table notes (
 id uuid primary key default gen_random_uuid(), customer_id uuid not null references customers(id), body text not null check(length(trim(body))>0), actor text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table month_reviews (
 id uuid primary key default gen_random_uuid(), month date not null, currency text not null, source_total numeric(18,2) not null,
 evidence text not null, actor text not null, fingerprint text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table audit_log (
 id uuid primary key default gen_random_uuid(), entity text not null, record_id uuid not null, operation text not null, actor text not null,
 before_record jsonb, after_record jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
do $$ declare t text; begin foreach t in array array['customers','imports','monthly_mrr','actions','notes','month_reviews','audit_log'] loop
 execute format('create trigger touch before update on %I for each row execute function touch_updated_at()',t);
 execute format('alter table %I enable row level security',t);
 execute format('revoke all on %I from public',t);
 end loop; end $$;
create index monthly_mrr_period on monthly_mrr(month,currency);
create index actions_open on actions(due_on) where status='open';
create view v_movements as
select m.id,m.customer_id,c.name,c.owner,c.segment,m.month,m.currency,m.mrr,p.mrr as prior_mrr,
 case when p.currency=m.currency then m.mrr-p.mrr end as change,
 case when p.id is null then 'first_or_gap'
      when p.currency<>m.currency then 'currency_changed'
      when p.mrr=0 and m.mrr>0 and exists(select 1 from monthly_mrr h where h.customer_id=m.customer_id and h.month<p.month and h.mrr>0 and h.currency=m.currency) then 'reactivation'
      when p.mrr=0 and m.mrr>0 then 'activation'
      when p.mrr>0 and m.mrr=0 then 'churn'
      when m.mrr>p.mrr then 'expansion'
      when m.mrr<p.mrr then 'contraction' else 'unchanged' end as movement
from monthly_mrr m join customers c on c.id=m.customer_id
left join monthly_mrr p on p.customer_id=m.customer_id and p.month=(date_trunc('month',m.month)-interval '1 day')::date;
create view v_monthly as
select month,currency,count(*)::int observed_customers,count(*) filter(where mrr>0)::int active_customers,
 sum(mrr) as mrr,sum(mrr)*12 as arr_run_rate,
 count(*) filter(where movement in ('first_or_gap','currency_changed'))::int non_comparable,
 sum(change) as comparable_change from v_movements group by month,currency;
create view v_attention as
select 'Overdue action' as kind,a.id,c.name,a.owner,a.due_on as due,a.title as detail from actions a join customers c on c.id=a.customer_id where a.status='open' and a.due_on<current_date
union all select 'Missing owner',id,name,owner,null,'Assign the revenue review' from customers where trim(owner)=''
union all select 'Retention review',id,name,owner,retention_review_on,'Review the need to keep identifiable records' from customers where retention_review_on<current_date
union all select 'Stale accuracy review',id,name,owner,reviewed_on,'Internal 30-day review policy' from customers where reviewed_on is null or reviewed_on<current_date-30;
revoke all on v_movements,v_monthly,v_attention from public;
