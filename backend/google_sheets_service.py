import requests
import csv
import io
import re

def get_csv_export_url(sheet_link):
    # Extracts the document ID from a standard Google Sheets link
    # e.g. https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0
    match = re.search(r'/d/([a-zA-Z0-9-_]+)', sheet_link)
    if not match:
        return None
    doc_id = match.group(1)
    return f"https://docs.google.com/spreadsheets/d/{doc_id}/export?format=csv"

def fetch_google_form_responses(sheet_link):
    """
    Fetches rows from a public Google Sheet linked to a Google Form.
    Returns a list of dictionaries where keys are column headers.
    """
    csv_url = get_csv_export_url(sheet_link)
    if not csv_url:
        return {"success": False, "msg": "رابط Google Sheet غير صالح"}
        
    try:
        response = requests.get(csv_url, timeout=10)
        if response.status_code != 200:
            return {"success": False, "msg": "تعذر الوصول للملف. تأكد من أن إعدادات المشاركة هي 'أي شخص لديه الرابط يمكنه العرض'"}
            
        response.encoding = 'utf-8'
        csv_data = response.text
        
        parsed = list(csv.reader(io.StringIO(csv_data)))
        if not parsed:
            return {"success": True, "data": [], "headers": [], "raw": []}
        headers = parsed[0]
        raw = parsed[1:]
        rows = [dict(zip(headers, row)) for row in raw]
        return {
            "success": True,
            "data": rows,
            "headers": headers,
            "raw": raw
        }
        
    except Exception as e:
        return {"success": False, "msg": f"خطأ في الاتصال: {str(e)}"}
