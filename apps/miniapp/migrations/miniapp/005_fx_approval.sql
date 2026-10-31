ALTER TABLE vaynexo_catalog_settings ADD COLUMN IF NOT EXISTS rub_uzs numeric(12,4) CHECK(rub_uzs > 0 AND rub_uzs <= 1000000);
CREATE TABLE IF NOT EXISTS vaynexo_fx_proposals (
 id bigserial PRIMARY KEY,
 usd_uzs numeric(12,4) NOT NULL CHECK(usd_uzs > 0 AND usd_uzs <= 1000000),
 rub_uzs numeric(12,4) NOT NULL CHECK(rub_uzs > 0 AND rub_uzs <= 1000000),
 pricing_version integer NOT NULL,
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','stale')),
 notified_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 resolved_at timestamptz,
 resolved_by bigint
);
CREATE UNIQUE INDEX IF NOT EXISTS vaynexo_fx_one_pending ON vaynexo_fx_proposals(status) WHERE status='pending';
CREATE TABLE IF NOT EXISTS vaynexo_fx_audit (
 id bigserial PRIMARY KEY,
 proposal_id bigint NOT NULL UNIQUE REFERENCES vaynexo_fx_proposals(id),
 admin_id bigint NOT NULL,
 usd_uzs numeric(12,4) NOT NULL,
 rub_uzs numeric(12,4) NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);