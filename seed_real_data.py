import json
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from datetime import date, datetime, timedelta, timezone
from werkzeug.security import generate_password_hash
from app import app, db, User, Intern, Attendance, DocumentRequest, DocumentLifecycle, SystemLog, Form

def seed():
    with app.app_context():
        # Clear database tables safely
        db.drop_all()
        db.create_all()
        
        print("Seeding Users...")
        admin = User(
            username='admin',
            name='Hatim SAMI (مدير النظام)',
            email='admin@mahkama.ma',
            password=generate_password_hash('admin123'),
            role='Admin',
            can_manage_documents=True
        )
        
        manager1 = User(
            username='m.elamrani',
            name='محمد العمراني',
            email='m.elamrani@mahkama.ma',
            password=generate_password_hash('manager123'),
            role='Manager',
            permissions=json.dumps(['interns.view', 'attendance.view', 'forms.view']),
            can_manage_documents=True
        )
        
        manager2 = User(
            username='f.benali',
            name='فاطمة الزهراء بنعلي',
            email='f.benali@mahkama.ma',
            password=generate_password_hash('manager123'),
            role='Manager',
            permissions=json.dumps(['interns.view', 'vault.view']),
            can_manage_documents=False
        )
        
        db.session.add_all([admin, manager1, manager2])
        
        print("Seeding Interns...")
        intern1 = Intern(
            name='يوسف الإدريسي',
            name_fr='Youssef El Idrissi',
            email='youssef.elidrissi@uemf.ac.ma',
            national_id='CD789123',
            department='كتابة الضبط - قسم قضايا الإلغاء',
            encadrant='محمد العمراني',
            status='نشط',
            source='موقع الجامعة',
            photo_path='/api/uploads/intern1.png',
            phone='0661234567',
            start_date=date(2026, 2, 1),
            end_date=date(2026, 7, 31),
            date_of_birth=date(2003, 5, 14),
            university='جامعة يوروميد بفاس (UEMF)',
            specialty='هندسة الأمن السيبراني',
            address='حي النرجس، شارع القدس، فاس',
            documents=json.dumps({
                'id': '/api/uploads/intern1.png',
                'convention': '/api/uploads/intern1.png',
                'insurance': '/api/uploads/intern1.png'
            }),
            evaluation=json.dumps({
                'criteria': {'discipline': 4, 'skills': 4, 'teamwork': 5, 'initiative': 4, 'quality': 4},
                'comments': 'متدرب ممتاز ويمتلك مهارات عالية في البرمجة وحماية البيانات',
                'total': 18,
                'max': 20,
                'evaluator': 'محمد العمراني'
            })
        )

        intern2 = Intern(
            name='سارة العلمي',
            name_fr='Sara El Alami',
            email='sara.elalami@usmba.ac.ma',
            national_id='CB654321',
            department='قسم الشؤون الإدارية والمالية',
            encadrant='فاطمة الزهراء بنعلي',
            status='نشط',
            source='طلب مباشر',
            photo_path='/api/uploads/intern2.png',
            phone='0669876543',
            start_date=date(2026, 3, 1),
            end_date=date(2026, 6, 30),
            date_of_birth=date(2002, 11, 20),
            university='جامعة سيدي محمد بن عبد الله بفاس',
            specialty='القانون الإداري والعلوم الإدارية',
            address='حي طريق عين الشقف، فاس',
            documents=json.dumps({
                'id': '/api/uploads/intern2.png',
                'convention': '/api/uploads/intern2.png'
            })
        )

        intern3 = Intern(
            name='عمر التازي',
            name_fr='Omar Tazi',
            email='omar.tazi@uet.ac.ma',
            national_id='Z9871234',
            department='قسم المعلوميات والتجهيز',
            encadrant='Hatim SAMI',
            status='قيد المراجعة',
            source='منصة التسجيل',
            phone='0677112233',
            start_date=date(2026, 4, 1),
            end_date=date(2026, 8, 31),
            university='جامعة الأخوين بإفران',
            specialty='تطوير الويب والأنظمة الموزعة',
            address='وسط المدينة، فاس'
        )

        db.session.add_all([intern1, intern2, intern3])
        db.session.commit()
        
        # User accounts for interns
        u1 = User(username=intern1.email, name=intern1.name, email=intern1.email, password=generate_password_hash('password123'), role='Intern')
        u2 = User(username=intern2.email, name=intern2.name, email=intern2.email, password=generate_password_hash('password123'), role='Intern')
        u3 = User(username=intern3.email, name=intern3.name, email=intern3.email, password=generate_password_hash('password123'), role='Intern')
        db.session.add_all([u1, u2, u3])

        print("Seeding Document Lifecycle Records...")
        # Document Center files for Youssef El Idrissi
        d1 = DocumentLifecycle(
            intern_id=intern1.id,
            doc_type='CIN',
            custom_title='بطاقة التعريف الوطنية (CNI)',
            file_path='/api/uploads/intern1.png',
            uploaded_by='INTERN',
            status='APPROVED_AND_SIGNED',
            is_visible_to_intern=True,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        d2 = DocumentLifecycle(
            intern_id=intern1.id,
            doc_type='CONVENTION_SIGNED',
            custom_title='اتفاقية التدريب الموقعة',
            file_path='/api/uploads/intern1.png',
            uploaded_by='INTERN',
            status='APPROVED_AND_SIGNED',
            is_visible_to_intern=True,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        d3 = DocumentLifecycle(
            intern_id=intern1.id,
            doc_type='INSURANCE',
            custom_title='شهادة التأمين الصحي ضد الحوادث',
            file_path='/api/uploads/intern1.png',
            uploaded_by='INTERN',
            status='APPROVED_AND_SIGNED',
            is_visible_to_intern=True,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        d4 = DocumentLifecycle(
            intern_id=intern1.id,
            doc_type='CV',
            custom_title='السيرة الذاتية (Curriculum Vitae)',
            file_path='/api/uploads/intern1.png',
            uploaded_by='INTERN',
            status='PENDING_REVIEW',
            is_visible_to_intern=True,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        
        # Documents for Sara El Alami
        d5 = DocumentLifecycle(
            intern_id=intern2.id,
            doc_type='CIN',
            custom_title='بطاقة التعريف الوطنية',
            file_path='/api/uploads/intern2.png',
            uploaded_by='INTERN',
            status='APPROVED_AND_SIGNED',
            is_visible_to_intern=True,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )

        db.session.add_all([d1, d2, d3, d4, d5])

        print("Seeding Document Requests...")
        req1 = DocumentRequest(
            intern_id=intern1.id,
            document_type='other',
            custom_title='كشف النقط للسنة الأخيرة',
            note='يرجى رفع كشف النقط لسنة 2025/2026 المصادق عليه',
            status='pending',
            created_at=datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M')
        )
        db.session.add(req1)

        print("Seeding Attendance Logs...")
        today = date.today()
        for i in range(10):
            d = today - timedelta(days=i)
            a1 = Attendance(intern_id=intern1.id, date=d.strftime('%Y-%m-%d'), status='حاضر')
            a2 = Attendance(intern_id=intern2.id, date=d.strftime('%Y-%m-%d'), status='حاضر' if i != 2 else 'غائب')
            db.session.add_all([a1, a2])

        print("Seeding System Logs...")
        log1 = SystemLog(user='admin@mahkama.ma', action='تسجيل دخول رئيسي')
        log2 = SystemLog(user='admin@mahkama.ma', action='تحديث حالة المتدرب يوسف الإدريسي إلى نشط')
        db.session.add_all([log1, log2])
        
        db.session.commit()
        print("Successfully seeded full document center and intern portal data!")

if __name__ == '__main__':
    seed()
