-- Execute após habilitar a extensão pg_cron (ou permita sua instalação aqui).
-- NÃO apaga verificações pendentes por idade e NÃO dá validade aos códigos.
create extension if not exists pg_cron;
do $$ declare j bigint; begin
  for j in select jobid from cron.job where jobname='lc-cleanup-sends' loop
    perform cron.unschedule(j);
  end loop;
end $$;
select cron.schedule('lc-cleanup-sends','*/5 * * * *',
  $$select lc_private.cleanup_send_history();$$);
-- O limite usa os últimos 45 minutos em tempo real. A remoção física ocorre em até 5 minutos depois.
