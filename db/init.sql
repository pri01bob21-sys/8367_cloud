CREATE TABLE IF NOT EXISTS switch_data (
  id          SERIAL PRIMARY KEY,
  hostname    VARCHAR(255),
  ip_address  VARCHAR(45),
  data        JSONB NOT NULL,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_switch_data_created_at ON switch_data(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_switch_data_hostname    ON switch_data(hostname);
