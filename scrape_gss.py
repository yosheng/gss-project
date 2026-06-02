import requests
import os
import math
import re
import json
import glob
import argparse
from datetime import datetime
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
TOKEN_VALIDATE_URL = 'https://assistant.gss.com.tw/QuickSearchApi/auth/tokenvalidate'
GSS_NOTIFY_WEBHOOK_URL = os.getenv("GSS_NOTIFY_WEBHOOK_URL")
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
def send_notification(text: str) -> bool:
    """發送 Mattermost webhook 通知。"""
    if not GSS_NOTIFY_WEBHOOK_URL:
        print("⚠️  未設定 GSS_NOTIFY_WEBHOOK_URL，無法發送通知。")
        return False

    payload = {
        "username": "員工小助手",
        "icon_emoji": ":robot:",
        "text": text,
    }
    try:
        response = requests.post(GSS_NOTIFY_WEBHOOK_URL, json=payload, timeout=10)
        return response.status_code in (200, 201)
    except requests.exceptions.RequestException as e:
        print(f"❌ 通知發送失敗: {e}")
        return False


def validate_token() -> bool:
    """驗證 API_AUTH_TOKEN 是否有效，失效時發送 webhook 通知。"""
    print("🔑 正在驗證 API Token...")
    try:
        response = requests.get(TOKEN_VALIDATE_URL, headers=HEADERS, timeout=10)
        response.raise_for_status()
        if response.text.strip().lower() == 'true':
            print("✅ Token 驗證成功。")
            return True
        print("❌ Token 已失效（API 回傳 false）。")
        send_notification("⚠️ GSS API Token 已失效，請重新取得 Token 並更新 .env 檔案。")
        return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Token 驗證請求失敗: {e}")
        from http import HTTPStatus
        send_notification(f"⚠️ GSS API Token 驗證失敗：{HTTPStatus(e.response.status_code).phrase} {e.response.text}")
        return False


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


def fetch_existing_employees_from_supabase(supabase: Client):
    """
    從 Supabase 拉取所有現有員工資料。

    Args:
        supabase: Supabase 客戶端實例

    Returns:
        dict: {emp_id: {'job_status': str}} 的字典，方便快速查詢員工狀態
    """
    print("🔍 正在從 Supabase 拉取現有員工資料...")

    try:
        # 拉取所有員工資料（emp_id 和 job_status 用於比對）
        response = supabase.table(TABLE_NAME).select("emp_id, job_status").execute()

        if not response.data:
            print("ℹ️  Supabase 中目前沒有任何員工資料。")
            return {}

        # 將資料轉換為字典，方便快速查詢員工狀態
        existing_employees = {emp['emp_id']: {'job_status': emp.get('job_status', '')} for emp in response.data}
        print(f"✅ 成功拉取 {len(existing_employees)} 筆現有員工資料。")

        return existing_employees

    except Exception as e:
        print(f"❌ 從 Supabase 拉取資料時發生錯誤: {e}")
        return {}


def sync_employees_to_supabase(supabase: Client, transformed_data: list, departed_status='離職'):
    """
    同步員工資料到 Supabase，實現增量更新、離職標記和反聘處理。

    同步邏輯：
    1. API 返回的員工在 Supabase 不存在 → 新增記錄
    2. API 返回的員工在 Supabase 已存在且在職 → 更新記錄（包括 last_updated_at）
    3. API 返回的員工在 Supabase 已存在但已離職 → 反聘（更新為在職，清除 terminated_at）
    4. Supabase 存在在職但 API 未返回的員工 → 標記為離職（設置 terminated_at）
    5. Supabase 存在已離職且 API 未返回的員工 → 不做任何修改

    Args:
        supabase: Supabase 客戶端實例
        transformed_data: 轉換後的員工資料列表
        departed_status: 離職狀態的值（預設為 '離職'）

    Returns:
        dict: 包含統計資訊的字典 {'new': 新增數, 'updated': 更新數, 'departed': 離職數, 'rehired': 反聘數}
    """
    print("\n" + "="*50)
    print("開始同步資料到 Supabase...")
    print("="*50)

    # 統計資訊
    stats = {'new': 0, 'updated': 0, 'departed': 0, 'rehired': 0}

    # 1. 拉取 Supabase 中現有的員工資料（包含 emp_id 和 job_status）
    existing_employees = fetch_existing_employees_from_supabase(supabase)
    existing_emp_ids = set(existing_employees.keys())

    # 2. 從 API 數據中提取 emp_id 集合
    api_emp_ids = {record['emp_id'] for record in transformed_data if 'emp_id' in record}
    print(f"\n📊 從 API 獲取了 {len(api_emp_ids)} 筆員工資料。")

    # 3. 分析需要新增、更新和反聘的員工
    new_emp_ids = api_emp_ids - existing_emp_ids
    existing_in_api = api_emp_ids & existing_emp_ids

    # 區分更新和反聘
    update_emp_ids = set()
    rehired_emp_ids = set()

    for emp_id in existing_in_api:
        if existing_employees[emp_id]['job_status'] == departed_status:
            rehired_emp_ids.add(emp_id)
        else:
            update_emp_ids.add(emp_id)

    print(f"   - 需要新增：{len(new_emp_ids)} 筆")
    print(f"   - 需要更新：{len(update_emp_ids)} 筆")
    print(f"   - 需要反聘：{len(rehired_emp_ids)} 筆")

    # 4. 新增或更新員工資料
    current_time = datetime.now().isoformat()

    for record in transformed_data:
        emp_id = record.get('emp_id')
        if not emp_id:
            continue

        # 添加 last_updated_at 字段
        record['last_updated_at'] = current_time

        # 如果是反聘員工，清除 terminated_at
        if emp_id in rehired_emp_ids:
            record['terminated_at'] = None

    # 使用 upsert 一次性處理新增、更新和反聘
    try:
        if transformed_data:
            print(f"\n🔄 正在執行 upsert 操作...")
            response = supabase.table(TABLE_NAME).upsert(
                transformed_data,
                on_conflict='emp_id'
            ).execute()

            if response.data:
                stats['new'] = len(new_emp_ids)
                stats['updated'] = len(update_emp_ids)
                stats['rehired'] = len(rehired_emp_ids)
                print(f"✅ 成功新增/更新 {len(response.data)} 筆資料。")
                if stats['rehired'] > 0:
                    print(f"🎉 發現 {stats['rehired']} 位員工反聘。")
            else:
                print(f"⚠️  Upsert 操作完成，但未返回資料。")

    except Exception as e:
        print(f"❌ Upsert 操作失敗: {e}")
        return stats

    # 5. 標記新離職的員工（只處理在職 → 離職，已離職的不處理）
    departed_emp_ids = existing_emp_ids - api_emp_ids

    # 過濾出在職員工
    active_departed_emp_ids = {
        emp_id for emp_id in departed_emp_ids
        if existing_employees[emp_id]['job_status'] != departed_status
    }

    if active_departed_emp_ids:
        print(f"\n👋 發現 {len(active_departed_emp_ids)} 位在職員工已離職，正在更新狀態...")

        for emp_id in active_departed_emp_ids:
            try:
                response = supabase.table(TABLE_NAME).update({
                    'job_status': departed_status,
                    'terminated_at': current_time,
                    'last_updated_at': current_time
                }).eq('emp_id', emp_id).execute()

                if response.data:
                    stats['departed'] += 1
                    print(f"   - 已標記 {emp_id} 為離職")

            except Exception as e:
                print(f"   ❌ 更新 {emp_id} 離職狀態失敗: {e}")

        print(f"✅ 成功標記 {stats['departed']} 位員工為離職。")

    # 已離職員工不處理
    already_departed = departed_emp_ids - active_departed_emp_ids
    if already_departed:
        print(f"\nℹ️  發現 {len(already_departed)} 位員工已是離職狀態，不做修改。")

    if not departed_emp_ids:
        print(f"\nℹ️  沒有員工離職。")

    return stats


def main():
    """主執行函數"""
    parser = argparse.ArgumentParser(description="爬取 GSS 員工資料並存入 Supabase。")
    parser.add_argument('--source', type=str, choices=['api', 'local'], default='api',
                        help="選擇資料來源：'api' (從網路爬取) 或 'local' (從本地 data 資料夾讀取)。預設為 'api'。")
    args = parser.parse_args()

    # --- 步驟 0: 驗證 Token ---
    if not validate_token():
        print("❌ Token 驗證失敗，程式終止。")
        return

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

    # --- 步驟 3: 初始化 Supabase ---
    if not all([SUPABASE_URL, SUPABASE_KEY]):
        print("🔴 錯誤：請檢查 .env 檔案中的 Supabase URL/KEY 是否已設定。")
        return

    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("✅ Supabase 客戶端初始化成功。")
    except Exception as e:
        print(f"🔴 Supabase 初始化失敗: {e}")
        return

    # --- 步驟 4: 同步資料到 Supabase（增量更新 + 離職標記）---
    stats = sync_employees_to_supabase(supabase, transformed_data)

    # --- 輸出統計摘要 ---
    print("\n" + "="*50)
    print("📈 同步完成！統計摘要：")
    print("="*50)
    print(f"   ✅ 新增員工：{stats['new']} 筆")
    print(f"   🔄 更新員工：{stats['updated']} 筆")
    print(f"   🎉 反聘員工：{stats['rehired']} 筆")
    print(f"   👋 離職員工：{stats['departed']} 筆")
    print(f"   📊 總計處理：{stats['new'] + stats['updated'] + stats['rehired'] + stats['departed']} 筆")
    print("="*50 + "\n")


if __name__ == "__main__":
    main()