-- ============================================
-- 為 gss_employees 表添加新欄位
-- ============================================
-- 說明：
-- 表中已有欄位：
--   - created_at: 記錄創建時間
--   - job_status: 在職狀態（從 API 的 jobStatus 欄位獲取）
-- 本次新增欄位：
--   - last_updated_at: 最後更新時間（每次同步時更新）
-- ============================================

-- 添加 last_updated_at 欄位（預設為當前時間）
ALTER TABLE gss_employees
ADD COLUMN IF NOT EXISTS last_updated_at TIMESTAMPTZ DEFAULT NOW();

-- 為現有數據設置初始值
-- 使用 created_at 作為初始更新時間，若無則用當前時間
UPDATE gss_employees
SET last_updated_at = COALESCE(created_at, NOW())
WHERE last_updated_at IS NULL;

-- 添加索引以提升查詢性能
CREATE INDEX IF NOT EXISTS idx_gss_employees_emp_id ON gss_employees(emp_id);
CREATE INDEX IF NOT EXISTS idx_gss_employees_job_status ON gss_employees(job_status);
CREATE INDEX IF NOT EXISTS idx_gss_employees_last_updated ON gss_employees(last_updated_at);

-- 添加注釋
COMMENT ON COLUMN gss_employees.last_updated_at IS '最後更新時間（最近一次同步更新該記錄的時間）';