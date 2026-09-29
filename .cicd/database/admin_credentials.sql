UPDATE user_credentials
SET password_hash = :'admin_hash', password_salt = NULL, updated_at = CURRENT_TIMESTAMP
WHERE username = 'admin'
  AND password_hash = '$2a$12$ZbcSg6botbwvmQV3/wBAfEozQoOn+5V7F8s/5evMUNb7L6FgCmFaEQ==';

INSERT INTO user_credentials (user_id, username, display_name, password_hash, password_salt)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'admin',
  'System Administrator',
  :'admin_hash',
  NULL
)
ON CONFLICT DO NOTHING;
