-- Execute depois de 06-security-lgpd.sql.
-- Amplia a infraestrutura existente de códigos para uma finalidade própria de exclusão.
begin;

alter table lc_private.verification_attempts
  drop constraint if exists verification_attempts_purpose_check;

alter table lc_private.verification_attempts
  add constraint verification_attempts_purpose_check
  check (purpose in ('cadastro','recuperacao','exclusao'));

commit;
