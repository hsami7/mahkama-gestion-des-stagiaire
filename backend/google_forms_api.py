import os
import json
from google.oauth2 import service_account
from googleapiclient.discovery import build

SCOPES = [
    "https://www.googleapis.com/auth/forms.body",
    "https://www.googleapis.com/auth/drive"
]

def generate_google_form(title, fields_data, service_account_json_str, owner_email):
    """
    Creates a new Google Form using the Forms API.
    Shares the Form with the given owner_email.
    Returns the Form link and ID.
    """
    try:
        if not service_account_json_str:
            return {"success": False, "msg": "لم يتم تقديم محتوى Service Account JSON"}

        creds_dict = json.loads(service_account_json_str)
        creds = service_account.Credentials.from_service_account_info(creds_dict, scopes=SCOPES)
        
        forms_service = build('forms', 'v1', credentials=creds)
        drive_service = build('drive', 'v3', credentials=creds)

        # 1. Create the Form
        form = {
            "info": {
                "title": title,
                "documentTitle": title,
            }
        }
        result = forms_service.forms().create(body=form).execute()
        form_id = result["formId"]
        responder_uri = result["responderUri"]

        # 2. Add Questions
        requests_list = []
        index = 0
        
        for field in fields_data:
            question_item = {
                "createItem": {
                    "item": {
                        "title": field.get("label", "سؤال بدون عنوان"),
                        "questionItem": {
                            "question": {
                                "required": field.get("required", False),
                            }
                        }
                    },
                    "location": {
                        "index": index
                    }
                }
            }

            field_type = field.get("type", "text")
            # Map internal types to Google Forms types
            if field_type in ["text", "number", "email", "tel"]:
                question_item["createItem"]["item"]["questionItem"]["question"]["textQuestion"] = {
                    "paragraph": False
                }
            elif field_type == "textarea":
                question_item["createItem"]["item"]["questionItem"]["question"]["textQuestion"] = {
                    "paragraph": True
                }
            elif field_type == "date":
                question_item["createItem"]["item"]["questionItem"]["question"]["dateQuestion"] = {
                    "includeYear": True,
                    "includeTime": False
                }
            else:
                # Default to short text
                question_item["createItem"]["item"]["questionItem"]["question"]["textQuestion"] = {
                    "paragraph": False
                }

            requests_list.append(question_item)
            index += 1

        if requests_list:
            forms_service.forms().batchUpdate(
                formId=form_id,
                body={"requests": requests_list}
            ).execute()

        # 3. Share with the owner_email
        if owner_email:
            try:
                drive_service.permissions().create(
                    fileId=form_id,
                    body={
                        "type": "user",
                        "role": "writer", # Writer permission lets them edit and view responses
                        "emailAddress": owner_email
                    },
                    fields="id"
                ).execute()
            except Exception as share_err:
                # Ignore share errors to not block the success return
                print(f"Failed to share with {owner_email}: {share_err}")

        return {
            "success": True,
            "formId": form_id,
            "responderUri": responder_uri
        }

    except Exception as e:
        return {"success": False, "msg": f"حدث خطأ أثناء إنشاء النموذج: {str(e)}"}
