create extension if not exists pgcrypto;

create table if not exists columns (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  webhook_url text,
  confirmation_enabled boolean default false,
  confirmation_title text,
  confirmation_message text,
  indicator_color text default 'gray',
  position integer not null default 0,
  department text not null default 'suporte',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists tickets (
  id uuid default gen_random_uuid() primary key,
  external_id text,
  column_id uuid references columns(id) on delete set null,
  title text not null,
  description text,
  person text,
  source text not null check (source in ('academy', 'zendesk', 'chatguru', 'manual')),
  priority text not null default 'normal' check (priority in ('urgent', 'high', 'normal')),
  category text not null default 'suporte' check (category in ('licenca', 'bug', 'faq', 'suporte', 'sugestao')),
  status text not null default 'open',
  time_open text,
  suggested_response text,
  tags text[] default '{}',
  assignee text,
  position integer not null default 0,
  department text not null default 'suporte',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists briefings (
  id uuid default gen_random_uuid() primary key,
  generated_at timestamptz default now(),
  summary jsonb not null default '{}',
  priorities text[] default '{}',
  claude_analysis text,
  raw_data jsonb,
  department text not null default 'suporte'
);

create table if not exists webhook_logs (
  id uuid default gen_random_uuid() primary key,
  column_id uuid references columns(id),
  ticket_id uuid references tickets(id),
  webhook_url text not null,
  payload jsonb not null,
  status_code integer,
  success boolean default false,
  error_message text,
  fired_at timestamptz default now()
);

insert into columns (title, description, indicator_color, position)
values
  ('Triagem', 'Tickets recém-chegados', 'gray', 0),
  ('Liberar Licença', 'Aguardando liberação de acesso', 'yellow', 1),
  ('Bug / Suporte', 'Erros técnicos e análise', 'red', 2),
  ('FAQ', 'Dúvidas com resposta padrão', 'blue', 3),
  ('Resolvido', 'Tickets finalizados hoje', 'green', 4)
on conflict do nothing;

with column_map as (
  select id, position
  from columns
  where department = 'suporte'
),
tickets_seed(external_id, source, title, person, status, priority, category, time_open, suggested_response, tags, target_position, created_at, position) as (
  values
    ('AC-001','academy','Não consigo acessar o módulo 3 do curso','Fernanda Lima','open','urgent','licenca','3h','Olá Fernanda! Verifiquei sua conta e identifiquei que a licença do módulo 3 não foi ativada. Vou liberar agora mesmo. Em instantes você já terá acesso. Qualquer dúvida, estou à disposição!',array['acesso','módulo','licença'],0,'2026-03-23T06:12:00'::timestamptz,0),
    ('AC-002','academy','Vídeo travando no meio da aula — erro de streaming','Carlos Mendes','open','high','bug','1h 20m','Olá Carlos! Identificamos uma instabilidade no servidor de streaming que afetou alguns usuários hoje cedo. Já foi corrigida. Tente limpar o cache do navegador e recarregar a página. Se o problema persistir, me avise!',array['bug','streaming','vídeo'],0,'2026-03-23T07:45:00'::timestamptz,1),
    ('AC-003','academy','Como emito o certificado de conclusão?','Ana Paula Souza','open','normal','faq','45m','Olá Ana Paula! Para emitir seu certificado: acesse a área ''Meus Cursos'' → clique no curso concluído → botão ''Certificado''. O download é em PDF. Lembre que é necessário ter completado 100% das aulas!',array['certificado','conclusão','faq'],3,'2026-03-23T08:20:00'::timestamptz,0),
    ('AC-004','academy','Preciso de acesso para mais 3 colaboradores da empresa','Roberto Alves','open','high','licenca','2h','Olá Roberto! Para adicionar mais colaboradores ao seu plano corporativo, precisarei verificar seu contrato atual. Vou checar a disponibilidade de licenças extras. Poderia confirmar os e-mails dos 3 colaboradores?',array['corporativo','licença','colaboradores'],1,'2026-03-23T07:00:00'::timestamptz,0),
    ('ZD-001','zendesk','Sistema não importa planilha Excel — erro 422','Juliana Costa','open','urgent','bug','4h 30m','Olá Juliana! O erro 422 indica um problema de validação no formato da planilha. Identifiquei que versões Excel anteriores ao 2016 causam esse comportamento. Salve o arquivo como .xlsx (não .xls) e tente novamente. Caso persista, envie o arquivo que verificamos aqui.',array['bug','excel','importação','erro-422'],2,'2026-03-23T04:30:00'::timestamptz,0),
    ('ZD-002','zendesk','Solicito liberação de licença adicional — contrato #8821','Marcelo Ferreira','pending','high','licenca','1h','Olá Marcelo! Localizei o contrato #8821. Vou processar a liberação da licença adicional conforme solicitado. Você receberá o e-mail de confirmação em até 30 minutos. Confirme se o e-mail do novo usuário é o mesmo do cadastro.',array['licença','contrato','corporativo'],0,'2026-03-23T08:05:00'::timestamptz,2),
    ('ZD-003','zendesk','Como integrar API com sistema ERP legado?','Patricia Nunes','open','normal','suporte','5h','Olá Patricia! Temos documentação específica para integração com ERPs legados. Vou enviar o guia de webhooks e exemplos de autenticação via API key. Para ERPs com versões antigas, recomendamos o conector REST. Posso agendar uma call técnica se preferir?',array['api','erp','integração','técnico'],2,'2026-03-23T03:00:00'::timestamptz,1),
    ('ZD-004','zendesk','Sugestão: adicionar filtro por data no relatório','Eduardo Ramos','open','normal','sugestao','2d','Olá Eduardo! Obrigado pela sugestão! Já está no nosso roadmap para Q2/2026 — filtros avançados nos relatórios incluindo período personalizado. Vou registrar seu voto de prioridade. Você quer ser notificado quando for lançado?',array['sugestão','relatório','filtro','roadmap'],3,'2026-03-21T14:00:00'::timestamptz,1),
    ('AC-005','academy','Quero cancelar minha assinatura','Rodrigo Santos','open','urgent','suporte','30m','Olá Rodrigo! Sinto muito ouvir isso. Antes de prosseguir com o cancelamento, posso entender o que motivou essa decisão? Temos opções como pausar a assinatura por até 3 meses ou migrar para um plano mais adequado. Posso te ajudar a encontrar a melhor solução.',array['cancelamento','assinatura','retenção'],0,'2026-03-23T08:35:00'::timestamptz,3),
    ('ZD-005','zendesk','Senha resetada mas acesso ainda bloqueado','Camila Rocha','resolved','high','bug','2h 15m','Olá Camila! Há um cache de sessão que pode demorar até 15 minutos para expirar após o reset de senha. Tente acessar em aba anônima ou limpe os cookies. Se ainda estiver bloqueada, vou forçar a expiração da sessão manualmente pelo painel admin.',array['bug','senha','acesso','login'],4,'2026-03-23T06:50:00'::timestamptz,0)
)
insert into tickets (external_id, column_id, title, person, status, source, priority, category, time_open, suggested_response, tags, position, created_at, department)
select
  t.external_id,
  c.id,
  t.title,
  t.person,
  t.status,
  t.source,
  t.priority,
  t.category,
  t.time_open,
  t.suggested_response,
  t.tags,
  t.position,
  t.created_at,
  'suporte'
from tickets_seed t
join column_map c on c.position = t.target_position
where not exists (
  select 1
  from tickets existing
  where existing.external_id = t.external_id
    and existing.department = 'suporte'
);

alter table columns enable row level security;
alter table tickets enable row level security;
alter table briefings enable row level security;
alter table webhook_logs enable row level security;

drop policy if exists "allow all" on columns;
drop policy if exists "allow all" on tickets;
drop policy if exists "allow all" on briefings;
drop policy if exists "allow all" on webhook_logs;

create policy "allow all" on columns for all using (true);
create policy "allow all" on tickets for all using (true);
create policy "allow all" on briefings for all using (true);
create policy "allow all" on webhook_logs for all using (true);

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_columns_updated_at on columns;
create trigger update_columns_updated_at
before update on columns
for each row execute function update_updated_at();

drop trigger if exists update_tickets_updated_at on tickets;
create trigger update_tickets_updated_at
before update on tickets
for each row execute function update_updated_at();
