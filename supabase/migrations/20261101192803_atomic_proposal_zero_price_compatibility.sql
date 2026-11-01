-- Server-only transaction: signature, project, instalments and notification
-- either commit together or leave the proposal pending for a safe retry.
create or replace function public.accept_proposal_atomic(
  p_proposal_id uuid, p_package_id uuid, p_client_id uuid, p_signer_name text,
  p_expected_name text, p_expected_price numeric, p_stages jsonb,
  p_discount numeric default 0, p_discount_note text default null
) returns uuid
language plpgsql security invoker set search_path = ''
as $$
declare
  proposal public.proposals%rowtype;
  package public.proposal_packages%rowtype;
  project_id uuid;
  client_name text;
  v_signed_at timestamptz := now();
  discount numeric := coalesce(p_discount, 0);
  stage_count integer;
begin
  select * into proposal from public.proposals where id = p_proposal_id for update;
  if not found or proposal.client_id is distinct from p_client_id then
    raise exception 'غير مصرح لك بهذا العرض';
  end if;
  if proposal.status <> 'pending' then
    raise exception 'تم اتخاذ قرار بخصوص هذا العرض بالفعل';
  end if;
  select * into package from public.proposal_packages
    where id = p_package_id and proposal_id = p_proposal_id for share;
  if not found or package.name is distinct from p_expected_name or package.price is distinct from p_expected_price then
    raise exception 'تغيرت بيانات الباقة. حدّث الصفحة وحاول مجددًا';
  end if;
  if p_signer_name is null or cardinality(regexp_split_to_array(trim(p_signer_name), '\s+')) < 3 then
    raise exception 'من فضلك اكتب اسمك الثلاثي كامل كتوقيع';
  end if;
  if discount < 0 or package.price < 0 or discount > package.price or jsonb_typeof(p_stages) is distinct from 'array' then
    raise exception 'Invalid payment plan';
  end if;
  stage_count := jsonb_array_length(p_stages);
  if stage_count > 0 and (
    exists(select 1 from jsonb_to_recordset(p_stages) as s(title text, amount numeric, status text)
      where nullif(trim(s.title), '') is null or s.amount is null or s.amount < 0 or s.status is null or s.status not in ('upcoming', 'awaiting_payment'))
    or (select sum(s.amount) from jsonb_to_recordset(p_stages) as s(amount numeric)) <> package.price - discount
  ) then raise exception 'Invalid payment plan'; end if;

  insert into public.projects(client_id, title, package_name, package_price,
    original_price, discount_amount, discount_note, discount_applied_at)
  values(proposal.client_id, proposal.project_title, package.name, package.price - discount,
    case when discount > 0 then package.price end, discount,
    case when discount > 0 then p_discount_note end,
    case when discount > 0 then v_signed_at end)
  returning id into project_id;

  insert into public.stages(project_id, stage_number, title, description, amount, status)
  select project_id, ordinality::integer, item->>'title', item->>'description',
    (item->>'amount')::numeric, item->>'status'
  from jsonb_array_elements(p_stages) with ordinality as plan(item, ordinality);

  update public.proposals set status = 'accepted', selected_package_id = package.id,
    signer_name = trim(p_signer_name), signed_at = v_signed_at, decided_at = v_signed_at
  where id = proposal.id;

  select full_name into client_name from public.clients where id = proposal.client_id;
  insert into public.notifications(client_id, project_id, type, message, link, for_admin)
  values(proposal.client_id, project_id, 'proposal_accepted',
    client_name || ' وافق على العرض ووقّع العقد — "' || proposal.project_title || '"',
    '/admin/projects/' || project_id::text, true);
  return project_id;
end;
$$;
revoke all on function public.accept_proposal_atomic(uuid, uuid, uuid, text, text, numeric, jsonb, numeric, text) from public, anon, authenticated;
grant execute on function public.accept_proposal_atomic(uuid, uuid, uuid, text, text, numeric, jsonb, numeric, text) to service_role;
