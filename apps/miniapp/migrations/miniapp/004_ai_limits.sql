CREATE TABLE IF NOT EXISTS vaynexo_ai_limits (
 telegram_id bigint PRIMARY KEY CHECK(telegram_id>0),
 next_request_at timestamptz NOT NULL,
 usage_day date NOT NULL DEFAULT CURRENT_DATE,
 requests integer NOT NULL DEFAULT 1 CHECK(requests>0)
);
