CREATE TABLE IF NOT EXISTS vaynexo_accounts (
 telegram_id bigint PRIMARY KEY CHECK(telegram_id>0),
 first_name varchar(128) NOT NULL DEFAULT '',
 last_name varchar(128) NOT NULL DEFAULT '',
 username varchar(64),
 language_code varchar(16),
 created_at timestamptz NOT NULL DEFAULT now(),
 last_seen_at timestamptz NOT NULL DEFAULT now()
);
