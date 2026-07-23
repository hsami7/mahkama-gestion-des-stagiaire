import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import json
import os

SETTINGS_FILE = os.path.join(os.path.dirname(__file__), 'integration_settings.json')

def get_settings():
    if os.path.exists(SETTINGS_FILE):
        try:
            with open(SETTINGS_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                # Defaults
                return {
                    'email_provider': data.get('email_provider', 'gmail'),
                    'gmail_address': data.get('gmail_address', ''),
                    'gmail_app_password': data.get('gmail_app_password', '')
                }
        except:
            pass
    return {'email_provider': 'gmail', 'gmail_address': '', 'gmail_app_password': ''}

def save_settings(data):
    with open(SETTINGS_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

def get_smtp_config(provider):
    if provider == 'outlook':
        return 'smtp.office365.com', 587
    return 'smtp.gmail.com', 587

def send_email(to_email, subject, body_html):
    settings = get_settings()
    sender_email = settings.get('gmail_address')
    password = settings.get('gmail_app_password')
    provider = settings.get('email_provider', 'gmail')

    if not sender_email or not password:
        print("Email settings not configured. Skipping email.")
        return False

    smtp_host, smtp_port = get_smtp_config(provider)

    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = sender_email
    msg['To'] = to_email

    msg.attach(MIMEText(body_html, 'html'))

    try:
        server = smtplib.SMTP(smtp_host, smtp_port)
        server.starttls()
        server.login(sender_email, password)
        server.send_message(msg)
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
