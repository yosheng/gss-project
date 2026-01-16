CREATE TABLE public.gss_employees (
    emp_id TEXT PRIMARY KEY,
    c_name TEXT,
    e_name TEXT,
    dep_code TEXT,
    job_status TEXT,
    encrypt_emp_id TEXT,
    per_seril_no TEXT,
    encrypt_per_seril_no TEXT,
    tit_name TEXT,
    dep_name_act TEXT,
    ofc_ext TEXT,
    introduction TEXT,
    cmp_ent_dte DATE,
    lev_exp_sdate TEXT,
    user_id TEXT,
    is_show_private_data BOOLEAN,
    photo_type TEXT,
    is_show_download_photo BOOLEAN,
    cmp_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 可選：為資料表添加註解
COMMENT ON TABLE public.gss_employees IS 'GSS employee directory data';