-- Apply once after add_mi_deployments_feature_postgresql.sql. Existing history is retained.
ALTER TABLE mi_deployment_operations ADD COLUMN IF NOT EXISTS started_at VARCHAR(40) NULL;
ALTER TABLE mi_deployment_operations ADD COLUMN IF NOT EXISTS finished_at VARCHAR(40) NULL;
ALTER TABLE mi_deployment_operations ADD COLUMN IF NOT EXISTS duration_ms BIGINT NULL;
ALTER TABLE mi_deployment_operations ADD COLUMN IF NOT EXISTS selected_project_ids TEXT NULL;
ALTER TABLE mi_deployment_targets ADD COLUMN IF NOT EXISTS project_name VARCHAR(255) NULL;
ALTER TABLE mi_deployment_targets ADD COLUMN IF NOT EXISTS component_name VARCHAR(255) NULL;
ALTER TABLE mi_deployment_targets ADD COLUMN IF NOT EXISTS environment_name VARCHAR(255) NULL;
ALTER TABLE mi_deployment_targets ADD COLUMN IF NOT EXISTS runtime_name VARCHAR(255) NULL;
ALTER TABLE mi_deployment_targets ADD COLUMN IF NOT EXISTS started_at VARCHAR(40) NULL;
ALTER TABLE mi_deployment_targets ADD COLUMN IF NOT EXISTS finished_at VARCHAR(40) NULL;
ALTER TABLE mi_deployment_targets ADD COLUMN IF NOT EXISTS duration_ms BIGINT NULL;
ALTER TABLE mi_deployment_events ADD COLUMN IF NOT EXISTS reason VARCHAR(1000) NULL;
ALTER TABLE mi_deployment_events ADD COLUMN IF NOT EXISTS http_status INT NULL;
ALTER TABLE mi_deployment_events ADD COLUMN IF NOT EXISTS evidence TEXT NULL;
CREATE INDEX IF NOT EXISTS idx_mi_dep_org_created ON mi_deployment_operations (org_handler, created_at);
CREATE INDEX IF NOT EXISTS idx_mi_dep_target_op ON mi_deployment_targets (deployment_id);
CREATE INDEX IF NOT EXISTS idx_mi_dep_event_op ON mi_deployment_events (deployment_id, created_at);
