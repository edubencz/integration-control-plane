INSERT INTO users (
  user_id, username, display_name, is_super_admin, is_project_author,
  is_oidc_user, require_password_change
)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'admin',
  'System Administrator',
  TRUE,
  TRUE,
  FALSE,
  TRUE
)
ON CONFLICT DO NOTHING;

INSERT INTO group_user_mapping (group_id, user_uuid)
SELECT group_id, '550e8400-e29b-41d4-a716-446655440000'
FROM user_groups
WHERE group_name = 'Super Admins'
ON CONFLICT DO NOTHING;
