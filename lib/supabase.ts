import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export type Employee = {
  emp_id: string;
  c_name: string | null;
  e_name: string | null;
  dep_code: string | null;
  job_status: string | null;
  encrypt_emp_id: string | null;
  per_seril_no: string | null;
  encrypt_per_seril_no: string | null;
  tit_name: string | null;
  dep_name_act: string | null;
  ofc_ext: string | null;
  introduction: string | null;
  cmp_ent_dte: string | null;
  lev_exp_sdate: string | null;
  user_id: string | null;
  is_show_private_data: boolean | null;
  photo_type: string | null;
  is_show_download_photo: boolean | null;
  cmp_code: string | null;
  created_at: string | null;
};