import requests
import os
import logging
from datetime import datetime, timedelta, timezone

from langchain_core.messages import HumanMessage, SystemMessage

# ================= 配置區域 =================
GITLAB_URL = "https://git.gss.com.tw"
USER_ID = "yosheng_zhang"
GITLAB_TOKEN = os.getenv("GITLAB_TOKEN")  # 請在白虎面板環境變數設定

# 通知自訂
BOT_NAME = "例會小助手"
BOT_ICON_EMOJI = ":frongwow:"  # 使用 Mattermost 內建圖標

# 時區
TW_TZ = timezone(timedelta(hours=8))

# LLM 初始化（優先使用 GOOGLE_API_KEY，其次 OPENAI_API_KEY）
def _init_llm():
    if os.getenv("GOOGLE_API_KEY"):
        from langchain_google_genai import ChatGoogleGenerativeAI
        return ChatGoogleGenerativeAI(model="gemini-2.0-flash")
    if os.getenv("OPENAI_API_KEY"):
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(model="gpt-4o-mini")
    logging.warning("未設定 GOOGLE_API_KEY 或 OPENAI_API_KEY，AI 總結功能將停用。")
    return None

LLM = _init_llm()

# 日誌配置
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
# ===========================================

# ==================== GitLab API ====================

def get_project_info(project_id) -> tuple[str, str]:
    """將 Project ID 轉換為 (專案名稱, path_with_namespace)，失敗時回傳 fallback。"""
    if not GITLAB_TOKEN:
        return f"ID:{project_id}", ""

    url = f"{GITLAB_URL}/api/v4/projects/{project_id}"
    headers = {"PRIVATE-TOKEN": GITLAB_TOKEN}
    try:
        resp = requests.get(url, headers=headers, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            return data.get("name_with_namespace", f"ID:{project_id}"), data.get("path_with_namespace", "")
        logging.warning(f"查詢專案 {project_id} 回傳 {resp.status_code}")
    except Exception as e:
        logging.error(f"無法獲取專案 {project_id} 名稱: {e}")
    return f"ID:{project_id}", ""


def fetch_gitlab_events(after_date: str) -> list:
    """
    從 GitLab API 抓取指定日期之後的事件列表。
    after_date 格式：YYYY-MM-DD
    回傳事件列表，失敗時回傳空列表。
    """
    url = f"{GITLAB_URL}/api/v4/users/{USER_ID}/events"
    params = {
        "after": after_date,
        "sort": "desc",
        "per_page": 100,
    }
    headers = {"PRIVATE-TOKEN": GITLAB_TOKEN} if GITLAB_TOKEN else {}

    try:
        resp = requests.get(url, params=params, headers=headers, timeout=15)
        logging.info(f"請求 GitLab API: {resp.url}")
        if resp.status_code == 200:
            return resp.json()
        logging.error(f"GitLab API 回傳錯誤 ({resp.status_code}): {resp.text}")
    except Exception as e:
        logging.error(f"GitLab API 請求失敗: {e}")
    return []


# ==================== 事件處理 ====================

def build_event_record(event: dict) -> dict:
    """
    將單筆 GitLab event 轉為持久化用的記錄格式。
    回傳：{ "project_name", "action", "target", "sent_at" }
    """
    project_name, project_path = get_project_info(event.get("project_id"))
    action = event.get("action_name", "unknown")
    push_data = event.get("push_data", {})
    # 優先取 push_data.commit_title，其次 target_title，最後 fallback
    target = (
        push_data.get("commit_title")
        or event.get("target_title")
        or "查看詳細動態"
    )
    created_at = datetime.fromisoformat(event["created_at"]).astimezone(TW_TZ).strftime("%Y-%m-%d %H:%M:%S")
    sent_at = datetime.now(TW_TZ).strftime("%Y-%m-%d %H:%M:%S")
    return {
        "project_name": project_name,
        "action": action,
        "target": target,
        "created_at": created_at,
        "sent_at": sent_at,
    }


def format_message(new_records: dict) -> str:
    """
    將新事件記錄組合成 Mattermost 訊息文字。
    new_records 格式：{ "event_id": { "project_name", "action", "target", ... }, ... }
    """
    count = len(new_records)
    lines = [f"🕵️‍♂️ **【{USER_ID}】活動報告（共 {count} 筆）**"]
    for record in new_records.values():
        lines.append(f"- 專案: `{record['project_name']}`| 時間: {record['created_at']}")
        lines.append(f"  - 動作: `{record['action']}` | 內容: {record['target']}")
    return "\n".join(lines)


# ==================== AI 總結 ====================

def summarize_with_llm(new_records: dict) -> str | None:
    """
    將事件記錄交給大模型總結，回傳總結文字。
    失敗或未設定 API Key 時回傳 None。
    """
    if LLM is None:
        return None

    # 將記錄轉為結構化文字，供模型閱讀
    lines = []
    for record in new_records.values():
        lines.append(
            f"- [{record['created_at']}] 專案：{record['project_name']} "
            f"| 動作：{record['action']} | 內容：{record['target']}"
        )
    records_text = "\n".join(lines)

    system_prompt = (
        f"你是一位技術工作彙報助手。以下是開發者 {USER_ID} 今日在 GitLab 上的活動記錄，"
        "請根據這些原始事件整理出一份簡潔的工作摘要，格式為條列式繁體中文。"
        "請依專案分組，合併相同專案的操作，突出重點貢獻，不要逐條重複原始記錄。"
    )

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=f"以下是今日活動記錄：\n\n{records_text}\n\n幫我總結內容並條列出來"),
    ]

    try:
        response = LLM.invoke(messages)
        return response.content
    except Exception as e:
        logging.error(f"AI 總結失敗: {e}")
        return None


# ==================== 通知發送 ====================

def send_notification(text: str) -> bool:
    """
    發送訊息至 Mattermost Webhook。
    回傳 True 表示成功，False 表示失敗。
    """
    webhook_url = os.getenv("MM_WEBHOOK_URL")
    if not webhook_url:
        logging.warning("未偵測到 MM_WEBHOOK_URL，取消發送。")
        return False

    payload = {
        "username": BOT_NAME,
        "icon_emoji": BOT_ICON_EMOJI,
        "text": text,
    }
    try:
        resp = requests.post(webhook_url, json=payload, timeout=10)
        logging.info(f"通知發送完成，狀態碼: {resp.status_code}")
        return resp.status_code in (200, 201)
    except Exception as e:
        logging.error(f"通知發送失敗: {e}")
        return False


# ==================== 主流程 ====================

def check_gitlab():
    """
    主監控流程：
    1. 從 GitLab 抓取最近事件
    2. 合併成一則訊息發送至 Mattermost
    """
    now_utc = datetime.now(timezone.utc)
    # GitLab API 只接受日期篩選，用昨天確保能取到今天全部事件，再本地去重
    api_after_date = (now_utc - timedelta(days=1)).date().isoformat()

    logging.info(f"【{BOT_NAME}】啟動：掃描 {USER_ID} 於 {api_after_date} 後的 GitLab 工作成果")

    # 抓取 GitLab 事件
    events = fetch_gitlab_events(api_after_date)
    if not events:
        logging.info("今天休息不需要彙報🥳")
        return

    # 建立新事件記錄（含完整內容）
    new_records = {}
    for event in events:
        event_id = str(event.get("id"))
        new_records[event_id] = build_event_record(event)

    # AI 總結（若無法總結則 fallback 為原始格式）
    summary = summarize_with_llm(new_records)
    msg = f"🤖 **AI 工作摘要**\n{summary}" if summary else format_message(new_records)

    # 組合訊息並發送
    success = send_notification(msg)

    if not success:
        logging.error("訊息發送失敗，下次執行將重新嘗試。")
        return

if __name__ == "__main__":
    check_gitlab()