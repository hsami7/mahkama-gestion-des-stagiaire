import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import json
import os

SETTINGS_FILE = os.path.join(os.path.dirname(__file__), 'integration_settings.json')

def get_settings():
    if os.path.exists(SETTINGS_FILE):
        with open(SETTINGS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def save_settings(data):
    with open(SETTINGS_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

def send_email(to_email, subject, body_html):
    settings = get_settings()
    gmail_user = settings.get('gmail_address')
    gmail_app_password = settings.get('gmail_app_password')
    
    if not gmail_user or not gmail_app_password:
        print("Email settings not configured. Cannot send email.")
        return False
        
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f"إدارة المتدربين <{gmail_user}>"
        msg['To'] = to_email
        
        part = MIMEText(body_html, 'html', 'utf-8')
        msg.attach(part)
        
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        server.login(gmail_user, gmail_app_password)
        server.sendmail(gmail_user, [to_email], msg.as_string())
        server.quit()
        return True
    except Exception as e:
        print(f"Failed to send email to {to_email}: {e}")
        return False

def send_received_email(to_email, name):
    subject = "تم استلام طلب التدريب الخاص بك"
    body = f"""
    <div dir="rtl" style="font-family: Arial, sans-serif; color: #333;">
        <h2>مرحباً {name}،</h2>
        <p>نود إعلامك بأنه قد تم استلام طلب التدريب الخاص بك بنجاح.</p>
        <p>طلبك الآن <strong>قيد المراجعة</strong> من قبل الإدارة. سيتم التواصل معك عبر البريد الإلكتروني بمجرد اتخاذ القرار النهائي.</p>
        <br>
        <p>مع تحيات،<br>إدارة المتدربين</p>
    </div>
    """
    return send_email(to_email, subject, body)

def send_accepted_email(to_email, name):
    subject = "تم قبول طلب التدريب الخاص بك"
    body = f"""
    <div dir="rtl" style="font-family: Arial, sans-serif; color: #333;">
        <h2>مرحباً {name}،</h2>
        <p>يسعدنا إخبارك بأنه <strong>تم قبول</strong> طلب التدريب الخاص بك.</p>
        <p>يرجى التوجه إلى المحكمة في أقرب وقت لإتمام الإجراءات اللازمة واستلام ورقة التعيين.</p>
        <br>
        <p>مع تحيات،<br>إدارة المتدربين</p>
    </div>
    """
    return send_email(to_email, subject, body)

def send_rejected_email(to_email, name, reason=""):
    subject = "بخصوص طلب التدريب الخاص بك"
    reason_html = f"<p>السبب: <strong>{reason}</strong></p>" if reason else ""
    body = f"""
    <div dir="rtl" style="font-family: Arial, sans-serif; color: #333;">
        <h2>مرحباً {name}،</h2>
        <p>نأسف لإخبارك بأنه <strong>لم يتم قبول</strong> طلب التدريب الخاص بك في الوقت الحالي.</p>
        {reason_html}
        <p>نتمنى لك التوفيق في مسيرتك القادمة.</p>
        <br>
        <p>مع تحيات،<br>إدارة المتدربين</p>
    </div>
    """
    return send_email(to_email, subject, body)
