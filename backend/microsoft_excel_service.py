import requests
import pandas as pd
import io
import re

def fetch_microsoft_excel_responses(link):
    """
    Fetches rows from a public Microsoft Excel (OneDrive) link.
    Tries to convert standard view links into direct download links.
    """
    try:
        download_url = link
        # Convert view links to download links if possible
        if "view.aspx" in link:
            download_url = link.replace("view.aspx", "download")
        elif "1drv.ms" in link:
            # Short links are harder, usually adding ?download=1 works if it redirects
            if "?" in download_url:
                download_url = download_url.replace("?web=1", "") + "&download=1"
            else:
                download_url += "?download=1"
        elif "sharepoint.com" in link:
            # SharePoint links might need ?download=1
            download_url = link.split("?")[0] + "?download=1"

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        }
        response = requests.get(download_url, headers=headers, allow_redirects=True)
        
        if response.status_code != 200:
            return {"success": False, "msg": f"Failed to fetch Excel file (HTTP {response.status_code}). Please ensure the link is public."}

        # Try to read as Excel
        try:
            df = pd.read_excel(io.BytesIO(response.content))
        except Exception as e:
            # Fallback to CSV just in case
            try:
                df = pd.read_csv(io.BytesIO(response.content))
            except:
                return {"success": False, "msg": f"Failed to parse file as Excel or CSV: {str(e)}"}

        df = df.fillna("")
        headers = list(df.columns)
        rows = df.to_dict('records')

        return {
            "success": True,
            "data": rows
        }

    except Exception as e:
        return {"success": False, "msg": f"Error fetching Excel: {str(e)}"}
