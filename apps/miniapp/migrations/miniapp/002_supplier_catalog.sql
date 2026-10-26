CREATE TABLE IF NOT EXISTS vaynexo_catalog_settings (
 id boolean PRIMARY KEY DEFAULT true CHECK(id),
 markup_bps integer CHECK(markup_bps BETWEEN 0 AND 100000),
 usd_uzs numeric(12,4) CHECK(usd_uzs > 0 AND usd_uzs <= 1000000),
 version integer NOT NULL DEFAULT 0,
 updated_by bigint,
 updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO vaynexo_catalog_settings(id) VALUES(true) ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS vaynexo_catalog_cache (
 id boolean PRIMARY KEY DEFAULT true CHECK(id),
 payload jsonb NOT NULL DEFAULT '[]',
 synced_at timestamptz,
 retry_after timestamptz NOT NULL DEFAULT '1970-01-01',
 lease_until timestamptz NOT NULL DEFAULT '1970-01-01'
);
INSERT INTO vaynexo_catalog_cache(id) VALUES(true) ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS vaynexo_catalog_audit (
 id bigserial PRIMARY KEY,
 telegram_id bigint NOT NULL,
 markup_bps integer NOT NULL,
 usd_uzs numeric(12,4) NOT NULL,
 version integer NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
