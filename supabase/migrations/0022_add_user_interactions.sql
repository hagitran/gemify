create table public.user_interactions (
  id integer generated always as identity not null,
  user_id text not null,
  place_id integer not null,
  action text not null,
  created_at timestamp with time zone null default now(),
  count integer null default 0,
  constraint user_interactions_pkey primary key (id),
  constraint user_interactions_place_id_places_id_fk foreign KEY (place_id) references places (id),
  constraint user_interactions_user_id_user_id_fk foreign KEY (user_id) references "user" (id),
  constraint user_interactions_unique_triplet unique (user_id, place_id, action)
) TABLESPACE pg_default; 