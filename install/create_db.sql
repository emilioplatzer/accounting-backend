create user pandora_user password 'pandora_3323948812bdz';
create database pandora_db owner pandora_user;
\c pandora_db

drop schema if exists pan cascade;
create schema pan authorization pandora_user;
grant all on schema pan to pandora_user;

create table pan.users(
  username text primary key,
  md5pass text,
  kind text,
  rol text
);
alter table pan."users" owner to pandora_user;

insert into pan.users 
  select 'test'||n, md5('clave'||n||'test'||n), 'direct', 'test'
    from generate_series(1,10) n;

