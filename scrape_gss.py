import requests
import os
import math
import re
import json
import glob
import argparse
from dotenv import load_dotenv
from supabase import create_client, Client

# --- 常數與配置 ---
# 載入 .env 檔案中的環境變數
load_dotenv()

# Supabase & API 配置
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")
API_AUTH_TOKEN = os.getenv("API_AUTH_TOKEN")
API_URL = 'https://assistant.gss.com.tw/QuickSearchApi/index/extendrequest/index/SearchEmployee'
TABLE_NAME = 'gss_employees'
DATA_DIR = 'data'  # 用於存放 JSON 檔案的資料夾

# 複製 cURL 的 Headers
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',
    'Accept': 'application/json, text/plain, */*',
    'Content-Type': 'application/json',
    'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6,zh-TW;q=0.5',
    'authorization': API_AUTH_TOKEN,
    'origin': 'https://assistant.gss.com.tw',
    'priority': 'u=1, i',
    'sec-ch-ua': '"Not;A=Brand";v="99", "Microsoft Edge";v="139", "Chromium";v="139"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    # Cookie 可以視情況加入，但通常 Authorization Token 已足夠
    # 'Cookie': '...'
}

# 請求的 Body (Payload)
BASE_PAYLOAD = {
  "isWork": True,
  "isDeparture": False,
  "dept": "",
  "employee": "",
  "ofcExt": "",
  "pageIndex": 0,
  "subordinates": [
    "YOSHENG_ZHANG"
  ]
}


# --- 輔助函數 ---
def camel_to_snake(name):
    """將駝峰式命名 (camelCase) 轉換為蛇形式命名 (snake_case)"""
    # 【修正】在 raw string 中，用於群組引用的反斜線應為單一反斜線
    s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
    return re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).lower()


# --- 核心功能 ---
def fetch_and_save_from_api():
    """從 API 爬取所有員工資料，並將每頁結果存為 JSON 檔案。"""
    # 確保 data 資料夾存在
    os.makedirs(DATA_DIR, exist_ok=True)

    all_employees = []
    page_index = 0
    total_records = -1

    while True:
        payload = BASE_PAYLOAD.copy()
        payload['pageIndex'] = page_index

        print(f"🚀 正在從 API 爬取第 {page_index + 1} 頁的資料...")

        try:
            response = requests.post(API_URL, headers=HEADERS, json=payload, timeout=30)
            response.raise_for_status()
            data = response.json()

            # 寫入 JSON 檔案
            file_path = os.path.join(DATA_DIR, f"page_{page_index}.json")
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=4)
            print(f"💾 已將結果儲存至 {file_path}")

            if data.get('status') != 200:
                print(f"❌ API 回應錯誤: {data.get('message')}")
                break

            rows = data.get('data', {}).get('rows', [])
            if not rows:
                print("✅ API 已沒有更多資料，爬取完成。")
                break

            if total_records == -1:
                total_records = data.get('data', {}).get('total', 0)
                print(f"🔍 發現總共有 {total_records} 筆員工資料。")

            all_employees.extend(rows)
            page_index += 1

            if len(all_employees) >= total_records:
                print("✅ 已爬取所有員工資料。")
                break
        except requests.exceptions.RequestException as e:
            print(f"❌ 網路請求失敗: {e}")
            return None

    return all_employees


def load_from_local():
    """從本地 data 資料夾讀取所有 JSON 檔案並合併資料。"""
    print("📂 正在從本地 `data` 資料夾讀取資料...")
    if not os.path.isdir(DATA_DIR):
        print(f"❌ 錯誤：找不到 `{DATA_DIR}` 資料夾。請先執行 `--source api` 來爬取並儲存資料。")
        return None

    all_employees = []
    json_files = sorted(glob.glob(os.path.join(DATA_DIR, 'page_*.json')),
                        key=lambda x: int(re.search(r'page_(\d+).json', x).group(1)))

    if not json_files:
        print(f"⚠️ 在 `{DATA_DIR}` 中找不到任何 `page_*.json` 檔案。")
        return []

    for file_path in json_files:
        print(f"   - 正在讀取 {os.path.basename(file_path)}...")
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            rows = data.get('data', {}).get('rows', [])
            all_employees.extend(rows)

    print(f"✅ 從本地檔案成功載入 {len(all_employees)} 筆資料。")
    return all_employees


def main():
    """主執行函數"""
    parser = argparse.ArgumentParser(description="爬取 GSS 員工資料並存入 Supabase。")
    parser.add_argument('--source', type=str, choices=['api', 'local'], default='api',
                        help="選擇資料來源：'api' (從網路爬取) 或 'local' (從本地 data 資料夾讀取)。預設為 'api'。")
    args = parser.parse_args()

    # --- 步驟 1: 根據來源獲取資料 ---
    if args.source == 'api':
        employees_data = fetch_and_save_from_api()
    else:  # args.source == 'local'
        employees_data = load_from_local()

    if not employees_data:
        print("未能獲取任何員工資料，程式終止。")
        return

    # --- 步驟 2: 轉換資料格式 ---

    # 定義資料表中的有效欄位
    VALID_COLUMNS = {
        'emp_id',
        'c_name',
        'e_name',
        'dep_code',
        'job_status',
        'encrypt_emp_id',
        'per_seril_no',
        'encrypt_per_seril_no',
        'tit_name',
        'dep_name_act',
        'ofc_ext',
        'introduction',
        'cmp_ent_dte',
        'lev_exp_sdate',
        'user_id',
        'is_show_private_data',
        'photo_type',
        'is_show_download_photo',
        'cmp_code',
        'created_at'
    }

    transformed_data = []
    for record in employees_data:
        # 先轉換所有鍵為 snake_case
        snake_case_record = {camel_to_snake(key): value for key, value in record.items()}

        # 只保留資料表中存在的欄位
        filtered_record = {
            k: (v if v != "" else None)
            for k, v in snake_case_record.items()
            if k in VALID_COLUMNS
        }

        # 特殊處理日期欄位
        if 'cmp_ent_dte' in filtered_record and filtered_record['cmp_ent_dte']:
            try:
                # 假設日期格式為 "YYYY-MM-DD"
                filtered_record['cmp_ent_dte'] = filtered_record['cmp_ent_dte'].split('T')[0]
            except:
                filtered_record['cmp_ent_dte'] = None

        transformed_data.append(filtered_record)

    print("🔄 資料格式轉換完成 (camelCase -> snake_case)。")

    # --- 步驟 3: 初始化 Supabase 並寫入資料 ---
    if not all([SUPABASE_URL, SUPABASE_KEY]):
        print("🔴 錯誤：請檢查 .env 檔案中的 Supabase URL/KEY 是否已設定。")
        return

    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("✅ Supabase 客戶端初始化成功。")
    except Exception as e:
        print(f"🔴 Supabase 初始化失敗: {e}")
        return

    print(f"正在將 {len(transformed_data)} 筆資料寫入 Supabase 的 '{TABLE_NAME}' 資料表中...")
    try:
        response = supabase.table(TABLE_NAME).upsert(
            transformed_data,
            on_conflict='emp_id'
        ).execute()

        if response.data:
            print(f"🎉 成功！資料已寫入 Supabase。")
        else:
            print(f"⚠️ 操作完成，但 Supabase 未返回成功資料。請檢查資料表。")
            if hasattr(response, 'error') and response.error:
                print(f"   錯誤詳情: {response.error}")

    except Exception as e:
        print(f"🔴 寫入 Supabase 時發生錯誤: {e}")


if __name__ == "__main__":
    main()