CREATE TABLE IF NOT EXISTS vaynexo_phone_registrations (
  telegram_id BIGINT PRIMARY KEY CHECK (telegram_id > 0),
  phone_ciphertext TEXT,
  phone_last4 VARCHAR(4),
  registered_at TIMESTAMPTZ,
  pending_until TIMESTAMPTZ,
  next_request_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  consent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  consent_version TEXT NOT NULL DEFAULT 'phone-v1',
  CHECK ((phone_ciphertext IS NULL AND registered_at IS NULL AND phone_last4 IS NULL)
      OR (phone_ciphertext IS NOT NULL AND registered_at IS NOT NULL AND phone_last4 ~ '^[0-9]{4}$'))
);
