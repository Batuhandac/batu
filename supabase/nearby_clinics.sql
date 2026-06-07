-- nearby_clinics RPC — emergency_score computed server-side
-- Run AFTER schema.sql

create or replace function nearby_clinics(
  p_lat float8,
  p_lng float8,
  p_radius_km float8 default 15,
  p_only_24_7 boolean default false,
  p_only_emergency boolean default false,
  p_only_verified boolean default false
)
returns table (
  id uuid,
  name text,
  address text,
  district text,
  lat float8,
  lng float8,
  phone text,
  is_24_7 boolean,
  accepts_emergency boolean,
  is_verified boolean,
  verification_status text,
  last_verified_at timestamptz,
  rating numeric,
  phone_active boolean,
  distance_km float8,
  is_open_now boolean,
  status text,
  emergency_score float8
)
language plpgsql security definer as $$
declare
  now_dow smallint := extract(dow from now() at time zone 'Europe/Istanbul')::smallint;
  now_time time := (now() at time zone 'Europe/Istanbul')::time;
begin
  return query
  with

  -- distance
  dist as (
    select
      c.*,
      (earth_distance(
        ll_to_earth(p_lat, p_lng),
        ll_to_earth(c.lat, c.lng)
      ) / 1000.0) as distance_km
    from clinics c
    where earth_box(ll_to_earth(p_lat, p_lng), p_radius_km * 1000) @> ll_to_earth(c.lat, c.lng)
      and (not p_only_24_7    or c.is_24_7)
      and (not p_only_emergency or c.accepts_emergency)
      and (not p_only_verified  or c.is_verified)
  ),

  -- today's opening hours
  open_status as (
    select
      d.id,
      coalesce(
        (
          select
            case
              when h.is_closed then false
              when h.is_overnight then (now_time >= h.open_time or now_time < h.close_time)
              else (now_time >= h.open_time and now_time < h.close_time)
            end
          from clinic_hours h
          where h.clinic_id = d.id and h.weekday = now_dow
          limit 1
        ),
        d.is_24_7
      ) as is_open
    from dist d
  ),

  -- phone_rate: avg of last 10 feedback
  phone_rate as (
    select
      clinic_id,
      coalesce(
        avg(phone_answered::int) filter (where phone_answered is not null),
        0.5
      ) as rate
    from (
      select clinic_id, phone_answered,
             row_number() over (partition by clinic_id order by created_at desc) rn
      from clinic_feedback
    ) sub
    where rn <= 10
    group by clinic_id
  ),

  -- open_ping: avg of pings in last 3h
  open_ping as (
    select
      clinic_id,
      coalesce(avg(is_open_now::int), 0.5) as rate
    from clinic_pings
    where created_at > now() - interval '3 hours'
    group by clinic_id
  ),

  -- negative reports in last 30 days
  neg_reports as (
    select clinic_id, count(*) as cnt
    from clinic_reports
    where created_at > now() - interval '30 days'
      and status = 'open'
    group by clinic_id
  ),

  -- assemble score
  scored as (
    select
      d.*,
      os.is_open,
      -- status string
      case
        when d.last_verified_at is null
          or d.last_verified_at < now() - interval '7 days' then 'unknown'
        when os.is_open then 'open'
        else 'closed'
      end as status_str,

      -- factor: open_now
      case
        when d.last_verified_at is null
          or d.last_verified_at < now() - interval '7 days' then 0.3
        when os.is_open then 1.0
        else 0.0
      end as f_open,

      (d.accepts_emergency::int)::float8 as f_emergency,
      (d.is_24_7::int)::float8 as f_full_time,
      (d.is_verified::int)::float8 as f_verified,
      greatest(0, least(1, 1 - d.distance_km / 15.0)) as f_distance,
      -- freshness: 0..1 over 7 days
      case
        when d.last_verified_at is null then 0
        else greatest(0, least(1,
          1 - extract(epoch from (now() - d.last_verified_at)) / 604800.0
        ))
      end as f_freshness,
      coalesce(op.rate, 0.5) as f_open_ping,
      coalesce(pr.rate, 0.5) as f_phone_rate,
      coalesce(d.rating, 3.5) / 5.0 as f_rating,
      coalesce(nr.cnt, 0) as neg_cnt
    from dist d
    join open_status os on os.id = d.id
    left join phone_rate pr on pr.clinic_id = d.id
    left join open_ping op on op.clinic_id = d.id
    left join neg_reports nr on nr.clinic_id = d.id
  )

  select
    s.id,
    s.name,
    s.address,
    s.district,
    s.lat,
    s.lng,
    s.phone,
    s.is_24_7,
    s.accepts_emergency,
    s.is_verified,
    s.verification_status,
    s.last_verified_at,
    s.rating,
    s.phone_active,
    s.distance_km,
    s.is_open,
    s.status_str as status,
    -- compute score then apply penalties
    (
      0.20 * s.f_open +
      0.16 * s.f_emergency +
      0.13 * s.f_full_time +
      0.11 * s.f_verified +
      0.11 * s.f_distance +
      0.10 * s.f_freshness +
      0.08 * s.f_open_ping +
      0.06 * s.f_phone_rate +
      0.05 * s.f_rating
    )
    -- negative reports penalty
    * (1 - least(0.6, s.neg_cnt::float8 * 0.15))
    -- definitely closed penalty
    * (case when not s.is_open and not s.is_24_7 then 0.2 else 1.0 end)
    as emergency_score
  from scored s
  order by emergency_score desc;
end;
$$;
