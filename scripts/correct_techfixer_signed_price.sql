-- Authorized 2026-11-02: correct professional TechFixer everywhere, including
-- signed proposals. Run only after provider-confirmed expiration of old sessions.
-- Never rewrite paid stages or financial order amounts.
do $$
declare project record;
begin
  perform 1 from public.proposals p where exists (
    select 1 from public.proposal_packages pp where pp.proposal_id=p.id
      and (pp.name ~* 'TechFixer' or pp.name like '%تيك فيكسر%')
      and (pp.name like '%الاحترافية%' or pp.name like '%محتوى%' or pp.name like '%مقال%') and pp.price=500
  ) for update;
  for project in select p.id from public.projects p
    where (p.package_name ~* 'TechFixer' or p.package_name like '%تيك فيكسر%')
      and (p.package_name like '%الاحترافية%' or p.package_name like '%محتوى%' or p.package_name like '%مقال%')
      and p.package_price=500 for update
  loop
    perform 1 from public.stages where project_id=project.id for update;
    if (select count(*) from public.stages where project_id=project.id) <> 2
      or exists(select 1 from public.stages where project_id=project.id and (amount<>250 or status not in ('upcoming','awaiting_payment')))
      or exists(select 1 from public.xpay_orders o join public.stages s on s.id=o.stage_id where s.project_id=project.id and o.status in ('pending','paid'))
      then raise exception 'Reconciliation required before price correction'; end if;
    update public.stages set amount=200 where project_id=project.id;
    update public.projects set package_price=400 where id=project.id;
  end loop;
  update public.proposal_packages set price=400
    where price=500 and (name ~* 'TechFixer' or name like '%تيك فيكسر%')
      and (name like '%الاحترافية%' or name like '%محتوى%' or name like '%مقال%');
end $$;
