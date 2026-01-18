-- 遷移腳本：添加離職時間欄位並遷移現有數據
-- 執行日期：2026-01-18
-- 說明：添加 terminated_at 欄位用於追蹤員工離職時間

-- 步驟 1: 添加 terminated_at 欄位
ALTER TABLE gss_employees
ADD COLUMN IF NOT EXISTS terminated_at TIMESTAMPTZ;

-- 步驟 2: 為已離職員工設置 terminated_at（一次性數據遷移）
-- 將已標記為離職狀態的員工，其 last_updated_at 複製到 terminated_at
UPDATE gss_employees
SET terminated_at = last_updated_at
WHERE job_status = '離職'
  AND terminated_at IS NULL
  AND last_updated_at IS NOT NULL;