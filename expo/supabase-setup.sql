-- Run this SQL in your Supabase Dashboard > SQL Editor

create table companies (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  contact text,
  phone text,
  email text,
  notes text,
  created_at timestamptz default now()
);

create table articles (
  id uuid default gen_random_uuid() primary key,
  article_number text not null unique,
  name text not null,
  category text,
  created_at timestamptz default now()
);

create table orders (
  id uuid default gen_random_uuid() primary key,
  order_group_id text not null,
  company_id uuid references companies(id) on delete cascade,
  article_id uuid references articles(id) on delete set null,
  article_number text not null,
  article_name text,
  quantity numeric default 1,
  price numeric default 0,
  unit text,
  order_date text,
  delivery_date text,
  expected_reorder_days integer default 30,
  notes text,
  created_at timestamptz default now()
);

-- Enable RLS with permissive policies (single-user app)
alter table companies enable row level security;
alter table articles enable row level security;
alter table orders enable row level security;

create policy "Allow all access" on companies for all using (true) with check (true);
create policy "Allow all access" on articles for all using (true) with check (true);
create policy "Allow all access" on orders for all using (true) with check (true);

-- Seed default companies
insert into companies (name) values
  ('Bolagsrätt'), ('Staples'), ('Lyreco'), ('Office Depot'),
  ('Kontorsexperten'), ('Papyrus'), ('NKV Kontorsvaror'), ('Duni'),
  ('Procurator'), ('Neutralt'), ('KiiltoClean'), ('Dahle'),
  ('Essity'), ('Tork'), ('SCA'), ('Abena'),
  ('Bong'), ('Fellowes'), ('HSM'), ('Leitz');
