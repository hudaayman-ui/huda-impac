/*
# Impact Furniture CRM Database Schema

1. New Tables
- `clients` — company/client records with bilingual names, industry, status, addresses, brief, notes, sales owner
- `contacts` — people linked to clients with phones, email, job title
- `deals` — sales pipeline deals with stage, probability, close date, notes, lost reason
- `deal_activities` — activity logs per deal (extracted from nested JSON)
- `projects` — client projects with status, dates, assigned team, description
- `tasks` — todo items with priority, status, due date, assigned team member
- `task_rollovers` — history of when a task's due date was rolled over
- `team_members` — staff/team members with roles, departments, phones, email
- `activity_logs` — global activity log for the CRM
- `app_settings` — single-row app configuration (settings, pipeline stages, dropdowns, profile, notifications, task settings)

2. Security
- Enable RLS on all tables.
- Single-tenant app: allow anon + authenticated CRUD since data is intentionally shared/public within the organization.
- No user_id columns since auth is not required for this CRM.
*/

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar text NOT NULL DEFAULT '',
  name_en text NOT NULL DEFAULT '',
  industry text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  addresses text[] NOT NULL DEFAULT '{}',
  brief text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  sales_owner text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  last_contacted_at timestamptz
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_clients" ON clients;
CREATE POLICY "anon_select_clients" ON clients FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_clients" ON clients;
CREATE POLICY "anon_insert_clients" ON clients FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_clients" ON clients;
CREATE POLICY "anon_update_clients" ON clients FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_clients" ON clients;
CREATE POLICY "anon_delete_clients" ON clients FOR DELETE
TO anon, authenticated USING (true);

-- Contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  job_title text NOT NULL DEFAULT '',
  phones text[] NOT NULL DEFAULT '{}',
  email text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_contacts" ON contacts;
CREATE POLICY "anon_select_contacts" ON contacts FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_contacts" ON contacts;
CREATE POLICY "anon_insert_contacts" ON contacts FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_contacts" ON contacts;
CREATE POLICY "anon_update_contacts" ON contacts FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_contacts" ON contacts;
CREATE POLICY "anon_delete_contacts" ON contacts FOR DELETE
TO anon, authenticated USING (true);

-- Team members table
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT '',
  phones text[] NOT NULL DEFAULT '{}',
  email text NOT NULL DEFAULT '',
  department text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_team_members" ON team_members;
CREATE POLICY "anon_select_team_members" ON team_members FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_team_members" ON team_members;
CREATE POLICY "anon_insert_team_members" ON team_members FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_team_members" ON team_members;
CREATE POLICY "anon_update_team_members" ON team_members FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_team_members" ON team_members;
CREATE POLICY "anon_delete_team_members" ON team_members FOR DELETE
TO anon, authenticated USING (true);

-- Deals table
CREATE TABLE IF NOT EXISTS deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  stage_id text NOT NULL DEFAULT '',
  probability integer NOT NULL DEFAULT 0,
  expected_close_date text NOT NULL DEFAULT '',
  assigned_to text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  lost_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_deals" ON deals;
CREATE POLICY "anon_select_deals" ON deals FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_deals" ON deals;
CREATE POLICY "anon_insert_deals" ON deals FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_deals" ON deals;
CREATE POLICY "anon_update_deals" ON deals FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_deals" ON deals;
CREATE POLICY "anon_delete_deals" ON deals FOR DELETE
TO anon, authenticated USING (true);

-- Deal activities table (replaces nested activityLog in deals)
CREATE TABLE IF NOT EXISTS deal_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  action text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE deal_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_deal_activities" ON deal_activities;
CREATE POLICY "anon_select_deal_activities" ON deal_activities FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_deal_activities" ON deal_activities;
CREATE POLICY "anon_insert_deal_activities" ON deal_activities FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_deal_activities" ON deal_activities;
CREATE POLICY "anon_update_deal_activities" ON deal_activities FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_deal_activities" ON deal_activities;
CREATE POLICY "anon_delete_deal_activities" ON deal_activities FOR DELETE
TO anon, authenticated USING (true);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active',
  start_date text NOT NULL DEFAULT '',
  expected_end_date text NOT NULL DEFAULT '',
  assigned_team text[] NOT NULL DEFAULT '{}',
  description text NOT NULL DEFAULT '',
  linked_deal_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_projects" ON projects;
CREATE POLICY "anon_select_projects" ON projects FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_projects" ON projects;
CREATE POLICY "anon_insert_projects" ON projects FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_projects" ON projects;
CREATE POLICY "anon_update_projects" ON projects FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_projects" ON projects;
CREATE POLICY "anon_delete_projects" ON projects FOR DELETE
TO anon, authenticated USING (true);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'todo',
  due_date text NOT NULL DEFAULT '',
  reminder_time text,
  assigned_to text NOT NULL DEFAULT '',
  linked_project_id text,
  linked_client_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_tasks" ON tasks;
CREATE POLICY "anon_select_tasks" ON tasks FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_tasks" ON tasks;
CREATE POLICY "anon_insert_tasks" ON tasks FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_tasks" ON tasks;
CREATE POLICY "anon_update_tasks" ON tasks FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_tasks" ON tasks;
CREATE POLICY "anon_delete_tasks" ON tasks FOR DELETE
TO anon, authenticated USING (true);

-- Task rollovers table (replaces nested rolloverHistory in tasks)
CREATE TABLE IF NOT EXISTS task_rollovers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  from_date text NOT NULL DEFAULT '',
  to_date text NOT NULL DEFAULT '',
  note text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE task_rollovers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_task_rollovers" ON task_rollovers;
CREATE POLICY "anon_select_task_rollovers" ON task_rollovers FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_task_rollovers" ON task_rollovers;
CREATE POLICY "anon_insert_task_rollovers" ON task_rollovers FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_task_rollovers" ON task_rollovers;
CREATE POLICY "anon_update_task_rollovers" ON task_rollovers FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_task_rollovers" ON task_rollovers;
CREATE POLICY "anon_delete_task_rollovers" ON task_rollovers FOR DELETE
TO anon, authenticated USING (true);

-- Activity logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL DEFAULT '',
  entity_id text NOT NULL DEFAULT '',
  action text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_activity_logs" ON activity_logs;
CREATE POLICY "anon_select_activity_logs" ON activity_logs FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_activity_logs" ON activity_logs;
CREATE POLICY "anon_insert_activity_logs" ON activity_logs FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_activity_logs" ON activity_logs;
CREATE POLICY "anon_update_activity_logs" ON activity_logs FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_activity_logs" ON activity_logs;
CREATE POLICY "anon_delete_activity_logs" ON activity_logs FOR DELETE
TO anon, authenticated USING (true);

-- App settings table (single row config)
CREATE TABLE IF NOT EXISTS app_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  app_name text NOT NULL DEFAULT 'Impact Furniture CRM',
  company_name text NOT NULL DEFAULT 'Impact Furniture',
  company_logo text,
  language text NOT NULL DEFAULT 'en',
  currency text NOT NULL DEFAULT 'EGP',
  date_format text NOT NULL DEFAULT 'DD/MM/YYYY',
  theme text NOT NULL DEFAULT 'dark',
  accent_color text NOT NULL DEFAULT 'blue',
  compact_mode boolean NOT NULL DEFAULT false,
  visible_modules text[] NOT NULL DEFAULT '{clients,contacts,pipeline,projects,tasks,team}',
  dashboard_widgets text[] NOT NULL DEFAULT '{todayTasks,inactiveDeals,behindProjects,inactiveClients,pipelineSummary,recentActivity}',
  profile jsonb NOT NULL DEFAULT '{"name":"","email":"","phone":"","role":"","photo":""}',
  notifications jsonb NOT NULL DEFAULT '{"dailyDigestEnabled":true,"dailyDigestTime":"08:00","clientCheckinEnabled":true,"clientCheckinFrequencyDays":2,"overdueAlertEnabled":true,"noActivityDealThreshold":7,"clientNotContactedThreshold":14}',
  pipeline_stages jsonb NOT NULL DEFAULT '[]',
  task_settings jsonb NOT NULL DEFAULT '{"defaultDueTime":"17:00","autoRollover":true,"rolloverTime":"00:00","defaultPriority":"medium"}',
  dropdowns jsonb NOT NULL DEFAULT '{"industries":["Hospitality","Real Estate","Education","Healthcare","Retail","Government","Corporate Office","Other"],"lostReasons":["Price too high","Chose competitor","Project postponed","No response","Other"],"departments":["Sales","Design","Execution","Administration"]}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_app_settings" ON app_settings;
CREATE POLICY "anon_select_app_settings" ON app_settings FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_app_settings" ON app_settings;
CREATE POLICY "anon_insert_app_settings" ON app_settings FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_app_settings" ON app_settings;
CREATE POLICY "anon_update_app_settings" ON app_settings FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_app_settings" ON app_settings;
CREATE POLICY "anon_delete_app_settings" ON app_settings FOR DELETE
TO anon, authenticated USING (true);

-- Insert default settings row if none exists
INSERT INTO app_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;
