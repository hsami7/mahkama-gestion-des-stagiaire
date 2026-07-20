import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, get_jwt
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

# Configurations
app.config['JWT_SECRET_KEY'] = 'mahkama-secret-key-2026' # Change in production
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'uploads')
app.config['MAX_CONTENT_LENGTH'] = 20 * 1024 * 1024 # 20MB max upload
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(os.path.dirname(__file__), 'instance', 'database.sqlite')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

jwt = JWTManager(app)
db = SQLAlchemy(app)

# Allow download endpoints (opened via window.open) to authenticate using ?token=...
# in addition to the standard Authorization: Bearer header.
app.config['JWT_TOKEN_LOCATION'] = ['headers', 'query_string']
app.config['JWT_QUERY_STRING_NAME'] = 'token'

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

def safe_filename(prefix: str, original: str) -> str:
    """Generate a safe, unique upload filename while preserving the original extension."""
    import uuid
    base = secure_filename(original)
    # secure_filename may strip the extension for unusual names; recover it from the original
    ext = ''
    if '.' in original:
        ext = '.' + original.rsplit('.', 1)[1].lower()
        if len(ext) > 10 or not ext[1:].isalnum():
            ext = ''
    if not ext and base and '.' in base:
        ext = '.' + base.rsplit('.', 1)[1].lower()
    if not base:
        base = f"{prefix}_{uuid.uuid4().hex}"
    else:
        base = base.rsplit('.', 1)[0]  # drop any extension from the base; we re-add it below
    name = f"{base}{ext}" if ext else base
    # guarantee uniqueness
    full = os.path.join(app.config['UPLOAD_FOLDER'], name)
    if os.path.exists(full):
        name = f"{base}_{uuid.uuid4().hex[:6]}{ext}"
    return name


# --- MODELS ---
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(50), nullable=False)
    permissions = db.Column(db.Text, nullable=True)

class Intern(db.Model):
    __tablename__ = 'interns'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(150), nullable=False)
    name_fr = db.Column(db.String(150), nullable=True)
    email = db.Column(db.String(150), nullable=True)
    national_id = db.Column(db.String(50), nullable=True)
    department = db.Column(db.String(100), nullable=True)
    encadrant = db.Column(db.String(150), nullable=True)
    status = db.Column(db.String(50), default='قيد المراجعة')
    photo_path = db.Column(db.String(255), nullable=True)
    phone = db.Column(db.String(50), nullable=True)
    start_date = db.Column(db.String(50), nullable=True)
    end_date = db.Column(db.String(50), nullable=True)
    date_of_birth = db.Column(db.String(50), nullable=True)
    university = db.Column(db.String(150), nullable=True)
    address = db.Column(db.Text, nullable=True)
    documents = db.Column(db.Text, nullable=True)
    evaluation = db.Column(db.Text, nullable=True)

class Attendance(db.Model):
    __tablename__ = 'attendance'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    intern_id = db.Column(db.Integer, db.ForeignKey('interns.id'), nullable=False)
    date = db.Column(db.String(20), nullable=False)
    status = db.Column(db.String(20), nullable=False)

class DocumentRequest(db.Model):
    __tablename__ = 'document_requests'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    intern_id = db.Column(db.Integer, db.ForeignKey('interns.id'), nullable=False)
    document_type = db.Column(db.String(50), nullable=False) # e.g. 'resume', 'id', 'other'
    custom_title = db.Column(db.String(150), nullable=True)  # Title if document_type == 'other'
    note = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), default='pending') # 'pending' or 'fulfilled'
    created_at = db.Column(db.String(50), nullable=False)
    template_path = db.Column(db.String(255), nullable=True)

class Form(db.Model):
    __tablename__ = 'forms'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    form_data = db.Column(db.Text, nullable=False)

class Message(db.Model):
    __tablename__ = 'messages'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    intern_id = db.Column(db.Integer, db.ForeignKey('interns.id'), nullable=False)
    sender_role = db.Column(db.String(20), nullable=False)  # 'admin' or 'intern'
    sender_name = db.Column(db.String(150), nullable=True)
    body = db.Column(db.Text, nullable=True)
    attachment_path = db.Column(db.String(255), nullable=True)
    attachment_name = db.Column(db.String(255), nullable=True)
    waiting_for_reply = db.Column(db.Boolean, default=False)
    expected_format = db.Column(db.String(20), nullable=True)  # 'text', 'pdf', 'word', 'any'
    replied = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.String(50), nullable=False)

class SystemLog(db.Model):
    __tablename__ = 'system_logs'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    user = db.Column(db.String(150), nullable=True)
    action = db.Column(db.Text, nullable=False)

DOC_TYPES = [
    'CIN', 'CV', 'INSURANCE', 'DEMANDE', 'CONVENTION_SIGNED',
    'FINAL_REPORT', 'ATTESTATION_SIGNED', 'OTHER'
]
DOC_STATUSES = ['MISSING', 'PENDING_REVIEW', 'REVISION_REQUESTED', 'APPROVED_AND_SIGNED']

class DocumentLifecycle(db.Model):
    __tablename__ = 'document_lifecycle'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    intern_id = db.Column(db.Integer, db.ForeignKey('interns.id'), nullable=False)
    doc_type = db.Column(db.String(50), nullable=False)
    file_path = db.Column(db.String(255), nullable=True)
    uploaded_by = db.Column(db.String(20), nullable=True)   # 'INTERN' or 'ADMIN'
    status = db.Column(db.String(30), default='MISSING')
    rejection_reason = db.Column(db.Text, nullable=True)
    is_visible_to_intern = db.Column(db.Boolean, default=False)
    custom_title = db.Column(db.String(150), nullable=True)
    created_at = db.Column(db.String(50), nullable=True)
    updated_at = db.Column(db.String(50), nullable=True)

    intern = db.relationship('Intern', backref='documents_lifecycle')

def log_action(user, action):
    try:
        new_log = SystemLog(user=user, action=action)
        db.session.add(new_log)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"Failed to log action: {e}")


def init_db():
    with app.app_context():
        db.create_all()
        # Auto-add newer columns to existing DBs
        try:
            cols = [c['name'] for c in db.inspect(db.engine).get_columns('interns')]
            if 'evaluation' not in cols:
                db.session.execute(db.text('ALTER TABLE interns ADD COLUMN evaluation TEXT'))
                db.session.commit()
        except Exception as e:
            db.session.rollback()
            print(f"Migration check failed: {e}")
        # Migrate legacy doc JSON to DocumentLifecycle
        try:
            _migrate_legacy_documents()
        except Exception as e:
            print(f"Document migration skipped: {e}")
        # Create default Admin user if none exists
        admin = User.query.filter_by(email='admin@mahkama.ma').first()
        if not admin:
            hashed_pw = generate_password_hash('admin123')
            admin = User(name='مدير النظام', email='admin@mahkama.ma', password=hashed_pw, role='Admin')
            db.session.add(admin)
            db.session.commit()


def _migrate_legacy_documents():
    """Migrate `interns.documents` JSON blob into DocumentLifecycle records."""
    import json
    TYPE_MAP = {
        'cin': 'CIN', 'id': 'CIN', 'identite': 'CIN',
        'cv': 'CV', 'resume': 'CV',
        'insurance': 'INSURANCE', 'assurance': 'INSURANCE',
        'demande': 'DEMANDE',
        'convention': 'CONVENTION_SIGNED',
        'photo': 'CIN',
    }
    interns = Intern.query.all()
    now = datetime.utcnow().isoformat()
    for intern in interns:
        if not intern.documents:
            continue
        try:
            docs = json.loads(intern.documents)
        except Exception:
            continue
        if not isinstance(docs, dict):
            continue
        for k, v in docs.items():
            if k == 'others':
                if isinstance(v, list):
                    for o in v:
                        if isinstance(o, dict) and o.get('file'):
                            title = o.get('name', 'مستند إضافي')
                            existing = DocumentLifecycle.query.filter_by(
                                intern_id=intern.id, custom_title=title
                            ).first()
                            if existing:
                                continue
                            dl = DocumentLifecycle(
                                intern_id=intern.id, doc_type='OTHER',
                                file_path=o['file'], uploaded_by='INTERN',
                                status='PENDING_REVIEW', is_visible_to_intern=False,
                                custom_title=title, created_at=now, updated_at=now
                            )
                            db.session.add(dl)
                continue
            if not v:
                continue
            doc_type = TYPE_MAP.get(k.strip().lower(), 'OTHER')
            existing = DocumentLifecycle.query.filter_by(
                intern_id=intern.id, doc_type=doc_type
            ).filter(
                DocumentLifecycle.custom_title.is_(None)
            ).first()
            if existing:
                continue
            dl = DocumentLifecycle(
                intern_id=intern.id, doc_type=doc_type,
                file_path=str(v) if isinstance(v, str) else None,
                uploaded_by='INTERN',
                status='PENDING_REVIEW', is_visible_to_intern=False,
                created_at=now, updated_at=now
            )
            db.session.add(dl)
        db.session.commit()

# --- AUTHENTICATION ROUTES ---
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    user = User.query.filter_by(email=email).first()
    
    if user and check_password_hash(user.password, password):
        # include permissions in token for frontend logic
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={
                'name': user.name, 
                'role': user.role, 
                'permissions': user.permissions
            }
        )
        log_action(user.name, "قام بتسجيل الدخول إلى النظام")
        return jsonify(
            access_token=access_token, 
            user={'id': user.id, 'name': user.name, 'role': user.role, 'permissions': user.permissions}
        ), 200
        
    return jsonify({"msg": "البريد الإلكتروني أو كلمة المرور غير صحيحة"}), 401


# --- USERS ROUTES (Admin Only) ---
@app.route('/api/users', methods=['GET'])
@jwt_required()
def get_users():
    current_user = get_jwt()
    if current_user.get('role') != 'Admin':
        return jsonify({"msg": "Unauthorized"}), 403
        
    users = User.query.all()
    return jsonify([{"id": u.id, "name": u.name, "email": u.email, "role": u.role, "permissions": u.permissions} for u in users])

@app.route('/api/users', methods=['POST'])
@jwt_required()
def add_user():
    current_user = get_jwt()
    if current_user.get('role') != 'Admin':
        return jsonify({"msg": "Unauthorized"}), 403
        
    data = request.json
    
    # Check if email exists
    if User.query.filter_by(email=data.get('email')).first():
        return jsonify({"msg": "البريد الإلكتروني موجود بالفعل"}), 400

    hashed_pw = generate_password_hash(data.get('password', 'password123'))
    new_user = User(
        name=data.get('name'), 
        email=data.get('email'), 
        password=hashed_pw, 
        role=data.get('role'), 
        permissions=data.get('permissions', '')
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    log_action(current_user.get('name', 'Admin'), f"قام بإضافة مستخدم جديد: {new_user.name}")
    
    return jsonify({"success": True, "id": new_user.id})

@app.route('/api/users/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    current_user = get_jwt()
    if current_user.get('role') != 'Admin':
        return jsonify({"msg": "Unauthorized"}), 403
        
    user = User.query.get(user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404
        
    data = request.json
    user.name = data.get('name', user.name)
    user.email = data.get('email', user.email)
    user.role = data.get('role', user.role)
    if 'permissions' in data:
        import json
        user.permissions = data.get('permissions')
        
    if data.get('password'):
        user.password = generate_password_hash(data.get('password'))
        
    db.session.commit()
    log_action(current_user.get('name', 'Admin'), f"قام بتحديث بيانات المستخدم: {user.name}")
    return jsonify({"success": True})

@app.route('/api/users/password', methods=['PUT'])
@jwt_required()
def change_password():
    current_user = get_jwt()
    user_id = current_user.get('sub')
    data = request.json
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404
        
    old_password = data.get('old_password')
    new_password = data.get('new_password')
    
    if not old_password or not new_password:
        return jsonify({"msg": "Old and new password required"}), 400
        
    from werkzeug.security import check_password_hash
    if not check_password_hash(user.password, old_password):
        return jsonify({"msg": "كلمة المرور القديمة غير صحيحة"}), 400
        
    hashed_pw = generate_password_hash(new_password)
    user.password = hashed_pw
    db.session.commit()
    
    log_action(user.name, "قام بتغيير كلمة المرور الخاصة به")
    return jsonify({"success": True})

@app.route('/api/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    current_user = get_jwt()
    if current_user.get('role') != 'Admin':
        return jsonify({"msg": "Unauthorized"}), 403
        
    user = User.query.get(user_id)
    if user:
        name_deleted = user.name
        db.session.delete(user)
        db.session.commit()
        log_action(current_user.get('name', 'Admin'), f"قام بحذف المستخدم: {name_deleted}")
    return jsonify({"success": True})


# --- INTERN ROUTES ---
@app.route('/api/interns', methods=['GET'])
@jwt_required()
def get_interns():
    interns = Intern.query.all()
    return jsonify([{
        "id": i.id, 
        "name": i.name, 
        "email": i.email, 
        "encadrant": i.encadrant, 
        "status": i.status,
        "photo_path": i.photo_path,
        "start_date": i.start_date,
        "end_date": i.end_date,
        "department": i.department
    } for i in interns])

@app.route('/api/interns/<int:intern_id>', methods=['GET'])
@jwt_required()
def get_intern(intern_id):
    intern = Intern.query.get(intern_id)
    if not intern:
        return jsonify({"msg": "Intern not found"}), 404
        
    import json
    docs = {}
    if intern.documents:
        try:
            docs = json.loads(intern.documents)
        except:
            pass

    evaluation = None
    if intern.evaluation:
        try:
            evaluation = json.loads(intern.evaluation)
        except:
            pass
            
    return jsonify({
        "id": intern.id, 
        "name": intern.name,
        "name_fr": intern.name_fr,
        "email": intern.email, 
        "national_id": intern.national_id,
        "department": intern.department, 
        "encadrant": intern.encadrant,
        "status": intern.status,
        "photo_path": intern.photo_path,
        "phone": intern.phone,
        "start_date": intern.start_date,
        "end_date": intern.end_date,
        "date_of_birth": intern.date_of_birth,
        "university": intern.university,
        "address": intern.address,
        "documents": docs,
        "evaluation": evaluation
    })

@app.route('/api/interns', methods=['POST'])
@jwt_required()
def add_intern():
    data = request.json
    import json
    new_intern = Intern(
        name=data.get('name'), 
        name_fr=data.get('name_fr'),
        email=data.get('email'), 
        national_id=data.get('national_id'),
        department=data.get('department'),
        encadrant=data.get('encadrant'),
        phone=data.get('phone'),
        start_date=data.get('start_date'),
        end_date=data.get('end_date'),
        date_of_birth=data.get('date_of_birth'),
        university=data.get('university'),
        address=data.get('address'),
        photo_path=data.get('photo_path'),
        documents=json.dumps(data.get('documents', {}))
    )
    db.session.add(new_intern)
    db.session.commit()
    
    # Create user account automatically
    if new_intern.email:
        existing_user = User.query.filter_by(email=new_intern.email).first()
        if not existing_user:
            from werkzeug.security import generate_password_hash
            hashed_pw = generate_password_hash('password123')
            new_user = User(
                name=new_intern.name,
                email=new_intern.email,
                password=hashed_pw,
                role='Intern',
                permissions=''
            )
            db.session.add(new_user)
            db.session.commit()

    current_user = get_jwt()
    user_name = current_user.get('name') if current_user else 'Unknown'
    log_action(user_name, f"قام بإضافة متدرب جديد: {new_intern.name}")
    
    return jsonify({"success": True, "id": new_intern.id})

@app.route('/api/interns/<int:intern_id>', methods=['PUT'])
@jwt_required()
def update_intern(intern_id):
    intern = Intern.query.get(intern_id)
    if not intern:
        return jsonify({"msg": "Intern not found"}), 404
        
    data = request.json
    import json
    
    intern.name = data.get('name', intern.name)
    if 'name_fr' in data:
        intern.name_fr = data.get('name_fr')
    intern.email = data.get('email', intern.email)
    intern.national_id = data.get('national_id', intern.national_id)
    intern.department = data.get('department', intern.department)
    if 'encadrant' in data:
        intern.encadrant = data.get('encadrant')
    intern.phone = data.get('phone', intern.phone)
    intern.start_date = data.get('start_date', intern.start_date)
    intern.end_date = data.get('end_date', intern.end_date)
    intern.date_of_birth = data.get('date_of_birth', intern.date_of_birth)
    intern.university = data.get('university', intern.university)
    intern.address = data.get('address', intern.address)
    if 'status' in data:
        intern.status = data.get('status')
    
    if 'photo_path' in data:
        intern.photo_path = data.get('photo_path')
    if 'documents' in data:
        intern.documents = json.dumps(data.get('documents'))
        
    db.session.commit()
    
    current_user = get_jwt()
    user_name = current_user.get('name') if current_user else 'Unknown'
    log_action(user_name, f"قام بتعديل بيانات المتدرب: {intern.name}")
    
    return jsonify({"success": True})

@app.route('/api/interns/<int:intern_id>/evaluation', methods=['POST'])
@jwt_required()
def save_evaluation(intern_id):
    intern = Intern.query.get(intern_id)
    if not intern:
        return jsonify({"msg": "Intern not found"}), 404

    import json
    data = request.json or {}
    current_user = get_jwt()
    user_name = current_user.get('name') if current_user else 'Unknown'

    evaluation = {
        "criteria": data.get('criteria', {}),
        "comments": data.get('comments', ''),
        "total": data.get('total'),
        "max": data.get('max'),
        "evaluator": user_name,
        "date": datetime.now().strftime('%Y-%m-%d %H:%M')
    }
    intern.evaluation = json.dumps(evaluation, ensure_ascii=False)
    db.session.commit()

    log_action(user_name, f"قام بتقييم المتدرب: {intern.name}")
    return jsonify({"success": True, "evaluation": evaluation})

@app.route('/api/interns/<int:intern_id>/attendance', methods=['GET'])
@jwt_required()
def get_attendance(intern_id):
    records = Attendance.query.filter_by(intern_id=intern_id).order_by(Attendance.date.desc()).all()
    return jsonify([{"id": r.id, "date": r.date, "status": r.status} for r in records])

@app.route('/api/interns/<int:intern_id>/attendance', methods=['POST'])
@jwt_required()
def mark_attendance(intern_id):
    data = request.json
    date = data.get('date')
    status = data.get('status')
    
    if not date or not status:
        return jsonify({"msg": "Date and status required"}), 400
        
    # Check if record exists for this date
    record = Attendance.query.filter_by(intern_id=intern_id, date=date).first()
    if record:
        record.status = status
    else:
        record = Attendance(intern_id=intern_id, date=date, status=status)
        db.session.add(record)
        
    db.session.commit()
    return jsonify({"success": True, "id": record.id})

@app.route('/api/attendance/by-date', methods=['GET'])
@jwt_required()
def get_attendance_by_date():
    from datetime import date as dt_date
    date_str = request.args.get('date')
    if not date_str:
        date_str = dt_date.today().isoformat()
    records = Attendance.query.filter_by(date=date_str).all()
    # return a dict mapping intern_id to status
    att_dict = {r.intern_id: r.status for r in records}
    return jsonify(att_dict)

import io
from flask import send_file

@app.route('/api/interns/<int:intern_id>/attestation', methods=['GET'])
@jwt_required()
def generate_attestation(intern_id):
    try:
        from reportlab.pdfgen import canvas
        from reportlab.lib.pagesizes import A4
        from reportlab.pdfbase import pdfmetrics
        from reportlab.pdfbase.ttfonts import TTFont
        import bidi.algorithm as bidi
        import arabic_reshaper
    except ImportError:
        return jsonify({"msg": "PDF generation library not installed"}), 500
        
    intern = Intern.query.get(intern_id)
    if not intern:
        return jsonify({"msg": "Intern not found"}), 404
        
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    
    # Try to load a font that supports Arabic if available, else fallback
    # For a real production app, we would bundle a font like Amiri or Tahoma.
    # We will use default Helvetica for French, and try to draw Arabic if possible.
    
    c.setFont("Helvetica-Bold", 24)
    c.drawCentredString(width/2.0, height - 100, "ATTESTATION DE STAGE")
    
    c.setFont("Helvetica", 14)
    text = f"Nous soussignes, certifions que Monsieur/Madame:"
    c.drawString(50, height - 200, text)
    
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, height - 230, f"{intern.name_fr or '__________________'}")
    
    c.setFont("Helvetica", 14)
    c.drawString(50, height - 280, f"A effectue un stage au sein de notre departement:")
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, height - 310, f"{intern.department or '__________________'}")
    
    c.setFont("Helvetica", 14)
    c.drawString(50, height - 360, f"Encadre(e) par:")
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, height - 390, f"{intern.encadrant or '__________________'}")
    
    c.setFont("Helvetica", 14)
    c.drawString(50, height - 440, f"Période: du {intern.start_date or '___'} au {intern.end_date or '___'}")
    
    c.drawString(50, height - 500, "Cette attestation est delivree pour servir et valoir ce que de droit.")
    
    c.drawString(width - 200, 150, "Signature et Cachet:")
    
    c.showPage()
    c.save()
    
    buffer.seek(0)
    filename = f"Attestation_{intern.id}.pdf"
    return send_file(buffer, as_attachment=True, download_name=filename, mimetype='application/pdf')

@app.route('/api/interns/<int:intern_id>', methods=['DELETE'])
@jwt_required()
def delete_intern(intern_id):
    intern = Intern.query.get(intern_id)
    if not intern:
        return jsonify({"msg": "Intern not found"}), 404
        
    name = intern.name
    db.session.delete(intern)
    db.session.commit()
    
    current_user = get_jwt()
    user_name = current_user.get('name') if current_user else 'Unknown'
    log_action(user_name, f"قام بحذف المتدرب: {name}")
    
    return jsonify({"success": True})

# --- FORM BUILDER ROUTES ---
@app.route('/api/forms', methods=['GET'])
@jwt_required()
def get_form():
    form = Form.query.first()
    if form:
        return jsonify({"success": True, "form_data": form.form_data})
    return jsonify({"success": True, "form_data": "[]"})

@app.route('/api/forms', methods=['POST'])
@jwt_required()
def save_form():
    data = request.json
    import json
    form_data = json.dumps(data.get('form_data', []))
    
    form = Form.query.first()
    if not form:
        form = Form(form_data=form_data)
        db.session.add(form)
    else:
        form.form_data = form_data
        
    db.session.commit()
    
    current_user = get_jwt()
    user_name = current_user.get('name') if current_user else 'Unknown'
    log_action(user_name, "قام بتحديث نموذج التسجيل")
    
    return jsonify({"success": True})

# --- PUBLIC FORM ROUTES ---
@app.route('/api/public-form', methods=['GET'])
def get_public_form():
    form = Form.query.first()
    if form:
        return jsonify({"success": True, "form_data": form.form_data})
    return jsonify({"success": True, "form_data": "[]"})

@app.route('/api/public-upload', methods=['POST'])
def public_upload():
    if 'file' not in request.files:
        return jsonify({"msg": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"msg": "No selected file"}), 400
        
    if file:
        file.seek(0, os.SEEK_END)
        size = file.tell()
        file.seek(0)
        if size > 15 * 1024 * 1024:
            return jsonify({"msg": "عذراً، حجم الملف يجب أن لا يتجاوز 15 ميجابايت"}), 400
            
        import uuid
        ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else 'bin'
        filename = f"public_{uuid.uuid4().hex[:8]}.{ext}"
        
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        return jsonify({"msg": "تم الرفع بنجاح", "filename": filename, "path": f"/api/uploads/{filename}"}), 201

@app.route('/api/public-submit', methods=['POST'])
def public_submit():
    data = request.json
    import json
    
    # Try to find name and email in the dynamic fields
    name = "متدرب جديد (من الاستمارة)"
    email = ""
    phone = ""
    photo_path = None
    
    for key, val in data.items():
        key_lower = key.lower()
        if "اسم" in key_lower or "name" in key_lower:
            name = val
        elif "بريد" in key_lower or "email" in key_lower:
            email = val
        elif "هاتف" in key_lower or "phone" in key_lower:
            phone = val
        elif isinstance(val, str) and val.startswith('/api/uploads/') and not photo_path:
            # First uploaded image goes to photo_path
            photo_path = val

    new_intern = Intern(
        name=name,
        email=email,
        phone=phone,
        photo_path=photo_path,
        status='قيد المراجعة',
        documents=json.dumps(data)
    )
    db.session.add(new_intern)
    db.session.commit()

    # Create user account automatically
    if email:
        existing_user = User.query.filter_by(email=email).first()
        if not existing_user:
            from werkzeug.security import generate_password_hash
            hashed_pw = generate_password_hash('password123')
            new_user = User(
                name=name,
                email=email,
                password=hashed_pw,
                role='Intern',
                permissions=''
            )
            db.session.add(new_user)
            db.session.commit()

    return jsonify({"success": True, "id": new_intern.id})

# --- DOCUMENT VAULT ROUTES (separate from intern profile documents) ---
VAULT_FOLDER = os.path.join(os.path.dirname(__file__), 'vault')
os.makedirs(VAULT_FOLDER, exist_ok=True)

@app.route('/api/vault', methods=['GET'])
@jwt_required()
def list_vault_documents():
    files = []
    if os.path.exists(VAULT_FOLDER):
        for filename in os.listdir(VAULT_FOLDER):
            filepath = os.path.join(VAULT_FOLDER, filename)
            if os.path.isfile(filepath):
                files.append({
                    "name": filename,
                    "size": os.path.getsize(filepath)
                })
    return jsonify(files)

@app.route('/api/vault', methods=['POST'])
@jwt_required()
def upload_vault_document():
    if 'file' not in request.files:
        return jsonify({"msg": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"msg": "No selected file"}), 400
        
    if file:
        if not file.filename.lower().endswith('.pdf'):
            return jsonify({"msg": "عذراً، يُسمح فقط برفع ملفات PDF"}), 400
            
        file.seek(0, os.SEEK_END)
        size = file.tell()
        file.seek(0)
        if size > 5 * 1024 * 1024:
            return jsonify({"msg": "عذراً، حجم الملف يجب أن لا يتجاوز 5 ميجابايت"}), 400
            
        custom_name = request.form.get('custom_name')
        if custom_name:
            filename = custom_name.replace('/', '_').replace('\\', '_')
            if not filename.lower().endswith('.pdf'):
                filename += '.pdf'
        else:
            filename = secure_filename(file.filename)
            if not filename:
                filename = "vault_" + file.filename.replace('/', '_').replace('\\', '_')
        file.save(os.path.join(VAULT_FOLDER, filename))
        
        current_user = get_jwt()
        user_name = current_user.get('name') if current_user else 'Unknown'
        log_action(user_name, f"قام برفع مستند للخزنة: {filename}")
        
        return jsonify({"msg": "تم رفع الملف بنجاح", "filename": filename}), 201

@app.route('/api/vault/<filename>', methods=['GET'])
def download_vault_document(filename):
    return send_from_directory(VAULT_FOLDER, filename)

@app.route('/api/vault/<filename>', methods=['DELETE'])
@jwt_required()
def delete_vault_document(filename):
    filepath = os.path.join(VAULT_FOLDER, filename)
    if os.path.exists(filepath):
        os.remove(filepath)
        current_user = get_jwt()
        user_name = current_user.get('name') if current_user else 'Unknown'
        log_action(user_name, f"قام بحذف مستند من الخزنة: {filename}")
        return jsonify({"success": True})
    return jsonify({"msg": "File not found"}), 404

# --- INTERN PROFILE DOCUMENT UPLOADS ---
@app.route('/api/documents', methods=['POST'])
@jwt_required()
def upload_document():
    if 'file' not in request.files:
        return jsonify({"msg": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"msg": "No selected file"}), 400
        
    if file:
        if not file.filename.lower().endswith('.pdf'):
            return jsonify({"msg": "عذراً، يُسمح فقط برفع ملفات PDF"}), 400
            
        file.seek(0, os.SEEK_END)
        size = file.tell()
        file.seek(0)
        if size > 5 * 1024 * 1024:
            return jsonify({"msg": "عذراً، حجم الملف يجب أن لا يتجاوز 5 ميجابايت"}), 400
            
        filename = safe_filename('doc', file.filename)
        if not filename.lower().endswith('.pdf'):
            filename = f"{filename}.pdf"
            
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        return jsonify({"msg": "تم رفع الملف بنجاح", "filename": filename}), 201

@app.route('/api/upload_photo', methods=['POST'])
@jwt_required()
def upload_photo():
    if 'file' not in request.files:
        return jsonify({"msg": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"msg": "No selected file"}), 400
        
    if file:
        if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
            return jsonify({"msg": "عذراً، يُسمح فقط برفع الصور (png, jpg, jpeg)"}), 400
            
        file.seek(0, os.SEEK_END)
        size = file.tell()
        file.seek(0)
        if size > 15 * 1024 * 1024:  # 15MB limit
            return jsonify({"msg": "عذراً، حجم الصورة يجب أن لا يتجاوز 15 ميجابايت"}), 400
            
        filename = secure_filename(file.filename)
        if not filename:
            import uuid
            filename = f"photo_{uuid.uuid4().hex}.jpg"
            
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        return jsonify({"msg": "تم رفع الصورة بنجاح", "photo_path": f"/api/uploads/{filename}"}), 201

@app.route('/api/documents/<filename>', methods=['GET'])
def download_document(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/api/uploads/<filename>', methods=['GET'])
def serve_upload(filename):
    import mimetypes
    path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    if os.path.isfile(path) and open(path, 'rb').read(5) == b'%PDF-':
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename, mimetype='application/pdf')
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# --- SYSTEM LOGS ROUTE ---
@app.route('/api/logs', methods=['GET'])
@jwt_required()
def get_logs():
    current_user = get_jwt()
    if current_user.get('role') != 'Admin':
        return jsonify({"msg": "Unauthorized"}), 403
        
    logs = SystemLog.query.order_by(SystemLog.timestamp.desc()).limit(50).all()
    return jsonify([{
        "id": l.id, 
        "timestamp": l.timestamp.isoformat(), 
        "user": l.user, 
        "action": l.action
    } for l in logs])

# --- DOCUMENT REQUESTS ROUTES ---
@app.route('/api/interns/<int:intern_id>/requests', methods=['POST'])
@jwt_required()
def create_document_request(intern_id):
    current_user = get_jwt()
    if current_user.get('role') != 'Admin':
        return jsonify({"msg": "Unauthorized"}), 403
        
    if request.is_json:
        data = request.json
    else:
        data = request.form

    doc_type = data.get('document_type')
    custom_title = data.get('custom_title')
    note = data.get('note')
    
    if not doc_type:
        return jsonify({"msg": "Document type is required"}), 400
        
    template_path = None
    if 'file' in request.files:
        file = request.files['file']
        if file and file.filename != '':
            if file.filename.lower().endswith('.pdf'):
                import uuid
                filename = f"tpl_{uuid.uuid4().hex}.pdf"
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                template_path = f"/api/uploads/{filename}"

    # Prevent duplicate pending requests for the same document: supersede any existing one
    DocumentRequest.query.filter_by(
        intern_id=intern_id, document_type=doc_type, custom_title=custom_title, status='pending'
    ).update({'status': 'superseded'})

    new_request = DocumentRequest(
        intern_id=intern_id,
        document_type=doc_type,
        custom_title=custom_title,
        note=note,
        status='pending',
        created_at=datetime.utcnow().isoformat(),
        template_path=template_path
    )
    db.session.add(new_request)
    db.session.commit()
    
    intern = Intern.query.get(intern_id)
    title_str = custom_title if doc_type == 'other' else doc_type
    log_action(current_user.get('name'), f"طلب مستند ({title_str}) من المتدرب {intern.name if intern else ''}")
    
    return jsonify({"msg": "Request created successfully", "request_id": new_request.id}), 201

@app.route('/api/intern/profile', methods=['GET'])
@jwt_required()
def get_my_intern_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404
        
    user_email = user.email
    intern = Intern.query.filter_by(email=user_email).first()
    if not intern:
        return jsonify({"msg": "Intern not found for this account"}), 404
        
    import json
    docs = {}
    if intern.documents:
        try:
            docs = json.loads(intern.documents)
        except:
            pass
            
    return jsonify({
        "id": intern.id, 
        "name": intern.name,
        "name_fr": intern.name_fr,
        "email": intern.email, 
        "national_id": intern.national_id,
        "department": intern.department, 
        "encadrant": intern.encadrant,
        "status": intern.status,
        "photo_path": intern.photo_path,
        "phone": intern.phone,
        "start_date": intern.start_date,
        "end_date": intern.end_date,
        "date_of_birth": intern.date_of_birth,
        "university": intern.university,
        "address": intern.address,
        "documents": docs
    }), 200

@app.route('/api/intern/requests', methods=['GET'])
@jwt_required()
def get_my_requests():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404
        
    user_email = user.email
    intern = Intern.query.filter_by(email=user_email).first()
    if not intern:
        return jsonify({"msg": "Intern not found for this account"}), 404
        
    reqs = DocumentRequest.query.filter_by(intern_id=intern.id, status='pending').all()
    
    result = []
    for r in reqs:
        result.append({
            "id": r.id,
            "document_type": r.document_type,
            "custom_title": r.custom_title,
            "note": r.note,
            "created_at": r.created_at,
            "template_path": r.template_path
        })
        
    return jsonify(result), 200

@app.route('/api/intern/requests/<int:request_id>/upload', methods=['POST'])
@jwt_required()
def upload_requested_document(request_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404
        
    user_email = user.email
    
    intern = Intern.query.filter_by(email=user_email).first()
    if not intern:
        return jsonify({"msg": "Intern not found"}), 404
        
    doc_request = DocumentRequest.query.get(request_id)
    if not doc_request or doc_request.intern_id != intern.id:
        return jsonify({"msg": "Request not found"}), 404
        
    if 'file' not in request.files:
        return jsonify({"msg": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"msg": "No selected file"}), 400
        
    if file and file.filename.lower().endswith('.pdf'):
        file.seek(0, os.SEEK_END)
        size = file.tell()
        file.seek(0)
        if size > 15 * 1024 * 1024:
            return jsonify({"msg": "عذراً، حجم الملف يجب أن لا يتجاوز 15 ميجابايت"}), 400
            
        filename = safe_filename('req', file.filename)
        if not filename.lower().endswith('.pdf'):
            filename = f"{filename}.pdf"
            
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        file_url = f"/api/uploads/{filename}"

        try:
            import json
            try:
                docs = json.loads(intern.documents or "{}")
            except Exception:
                docs = {}
            if not isinstance(docs, dict):
                docs = {}

            if doc_request.document_type == 'other':
                if 'others' not in docs or not isinstance(docs['others'], list):
                    docs['others'] = []
                req_name = doc_request.custom_title or 'مستند إضافي'
                existing = next((o for o in docs['others'] if isinstance(o, dict) and o.get('name') == req_name), None)
                if existing:
                    existing['file'] = file_url
                else:
                    docs['others'].append({"name": req_name, "file": file_url})
            else:
                docs[doc_request.document_type] = file_url

            intern.documents = json.dumps(docs)
            # Fulfill this request and any other pending request for the same document
            DocumentRequest.query.filter_by(
                intern_id=intern.id,
                document_type=doc_request.document_type,
                custom_title=doc_request.custom_title,
                status='pending'
            ).update({'status': 'fulfilled'})
            doc_request.status = 'fulfilled'
            db.session.commit()
            log_action(current_user.get('name'), f"قام برفع مستند ({doc_request.custom_title or doc_request.document_type}) استجابة لطلب")
        except Exception as e:
            db.session.rollback()
            print(f"Upload metadata update failed but file saved: {e}")
            # File was saved successfully; still report success to the client
            try:
                doc_request.status = 'fulfilled'
                db.session.commit()
            except Exception:
                pass

        return jsonify({"msg": "تم رفع المستند بنجاح"}), 200
        
    return jsonify({"msg": "Invalid file. Only PDF is allowed."}), 400

@app.route('/api/intern/upload_unrequested', methods=['POST'])
@jwt_required()
def upload_unrequested_document():
    user_id = get_jwt_identity()
    current_user = get_jwt()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404
        
    user_email = user.email
    
    intern = Intern.query.filter_by(email=user_email).first()
    if not intern:
        return jsonify({"msg": "Intern not found"}), 404
        
    doc_type = request.form.get('document_type')
    if not doc_type:
        return jsonify({"msg": "Document type is required"}), 400
        
    if 'file' not in request.files:
        return jsonify({"msg": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"msg": "No selected file"}), 400
        
    if file and file.filename.lower().endswith('.pdf'):
        file.seek(0, os.SEEK_END)
        size = file.tell()
        file.seek(0)
        if size > 15 * 1024 * 1024:
            return jsonify({"msg": "عذراً، حجم الملف يجب أن لا يتجاوز 15 ميجابايت"}), 400
            
        filename = safe_filename('doc', file.filename)
        if not filename.lower().endswith('.pdf'):
            filename = f"{filename}.pdf"
            
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        file_url = f"/api/uploads/{filename}"
        
        import json
        docs = json.loads(intern.documents or "{}")
        docs[doc_type] = file_url

        # Fulfill any pending request that matches this document (proactive upload counts as fulfilling)
        DocumentRequest.query.filter_by(
            intern_id=intern.id, document_type=doc_type, status='pending'
        ).update({'status': 'fulfilled'})

        intern.documents = json.dumps(docs)
        db.session.commit()

        log_action(current_user.get('name'), f"قام برفع مستند إضافي ({doc_type})")
        return jsonify({"msg": "تم رفع المستند بنجاح"}), 200
        
    return jsonify({"msg": "Invalid file. Only PDF is allowed."}), 400

# --- MESSAGING ROUTES (admin <-> intern) ---
def build_file_url(path: str) -> str:
    if not path:
        return ''
    if path.startswith('http'):
        return path
    name = path.replace('/api/uploads/', '').replace('/api/documents/', '').replace('/', '')
    return f"http://127.0.0.1:5055/api/uploads/{name}"

def allowed_message_attachment(filename: str) -> bool:
    if not filename:
        return False
    ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
    return ext in ('pdf', 'doc', 'docx', 'txt', 'png', 'jpg', 'jpeg', 'webp')

@app.route('/api/interns/<int:intern_id>/messages', methods=['GET'])
@jwt_required()
def get_messages(intern_id):
    msgs = Message.query.filter_by(intern_id=intern_id).order_by(Message.created_at.asc()).all()
    result = []
    for m in msgs:
        result.append({
            "id": m.id,
            "intern_id": m.intern_id,
            "sender_role": m.sender_role,
            "sender_name": m.sender_name,
            "body": m.body,
            "attachment_path": m.attachment_path,
            "attachment_name": m.attachment_name,
            "attachment_url": build_file_url(m.attachment_path) if m.attachment_path else None,
            "waiting_for_reply": m.waiting_for_reply,
            "expected_format": m.expected_format,
            "replied": m.replied,
            "created_at": m.created_at
        })
    return jsonify(result), 200

@app.route('/api/interns/<int:intern_id>/messages', methods=['POST'])
@jwt_required()
def send_message(intern_id):
    current_user = get_jwt()
    intern = Intern.query.get(intern_id)
    if not intern:
        return jsonify({"msg": "Intern not found"}), 404

    role = current_user.get('role')
    if role == 'Intern':
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user or (intern.email and user.email != intern.email):
            return jsonify({"msg": "Unauthorized"}), 403

    is_json = request.is_json
    body = (request.form.get('body') if not is_json else request.json.get('body')) or ''
    waiting_for_reply = False
    expected_format = None

    if role != 'Intern':
        waiting_for_reply = str((request.form.get('waiting_for_reply') if not is_json else request.json.get('waiting_for_reply')) or '').lower() in ('1', 'true', 'on')
        expected_format = (request.form.get('expected_format') if not is_json else request.json.get('expected_format')) or None

    attachment_path = None
    attachment_name = None
    if 'file' in request.files:
        file = request.files['file']
        if file and file.filename != '':
            if not allowed_message_attachment(file.filename):
                return jsonify({"msg": "عذراً، صيغة الملف غير مدعومة"}), 400
            file.seek(0, os.SEEK_END)
            size = file.tell()
            file.seek(0)
            if size > 15 * 1024 * 1024:
                return jsonify({"msg": "عذراً، حجم الملف يجب أن لا يتجاوز 15 ميجابايت"}), 400
            filename = safe_filename('msg', file.filename)
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            attachment_path = f"/api/uploads/{filename}"
            attachment_name = file.filename

    # When an intern replies to a message, mark waiting messages as replied
    if role == 'Intern' and (body.strip() != '' or attachment_path):
        Message.query.filter_by(intern_id=intern_id, waiting_for_reply=True).update({'replied': True})

    new_msg = Message(
        intern_id=intern_id,
        sender_role='intern' if role == 'Intern' else 'admin',
        sender_name=current_user.get('name'),
        body=body,
        attachment_path=attachment_path,
        attachment_name=attachment_name,
        waiting_for_reply=waiting_for_reply and role != 'Intern',
        expected_format=expected_format if role != 'Intern' else None,
        replied=False,
        created_at=datetime.utcnow().isoformat()
    )
    db.session.add(new_msg)
    db.session.commit()

    log_action(current_user.get('name'), f"أرسل رسالة للمتدرب {intern.name}")
    return jsonify({
        "id": new_msg.id,
        "intern_id": new_msg.intern_id,
        "sender_role": new_msg.sender_role,
        "sender_name": new_msg.sender_name,
        "body": new_msg.body,
        "attachment_path": new_msg.attachment_path,
        "attachment_name": new_msg.attachment_name,
        "attachment_url": build_file_url(new_msg.attachment_path) if new_msg.attachment_path else None,
        "waiting_for_reply": new_msg.waiting_for_reply,
        "expected_format": new_msg.expected_format,
        "replied": new_msg.replied,
        "created_at": new_msg.created_at
    }), 201

@app.route('/api/interns/<int:intern_id>/messages/<int:message_id>', methods=['DELETE'])
@jwt_required()
def delete_message(intern_id, message_id):
    current_user = get_jwt()
    if current_user.get('role') != 'Admin':
        return jsonify({"msg": "Unauthorized"}), 403
    msg = Message.query.filter_by(id=message_id, intern_id=intern_id).first()
    if not msg:
        return jsonify({"msg": "Message not found"}), 404
    if msg.attachment_path:
        try:
            name = msg.attachment_path.replace('/api/uploads/', '').replace('/', '')
            fp = os.path.join(app.config['UPLOAD_FOLDER'], name)
            if os.path.exists(fp):
                os.remove(fp)
        except Exception:
            pass
    db.session.delete(msg)
    db.session.commit()
    return jsonify({"success": True}), 200

# --- PERSONAL PROFILE EXPORT (md / PDF / Excel) ---
def render_intern_md(intern: Intern) -> str:
    docs = {}
    if intern.documents:
        try:
            docs = json.loads(intern.documents)
        except Exception:
            docs = {}
    others = docs.get('others', []) if isinstance(docs.get('others'), list) else []

    def row(label, val):
        return f"| {label} | {val or '—'} |"

    lines = []
    lines.append(f"# ملف المتدرب: {intern.name}")
    if intern.name_fr:
        lines.append(f"**{intern.name_fr}**")
    lines.append("")
    lines.append("## المعلومات الشخصية")
    lines.append("")
    lines.append("| الحقل | القيمة |")
    lines.append("| --- | --- |")
    lines.append(row("رقم التسجيل", f"INT-{intern.id:04d}"))
    lines.append(row("رقم الهوية الوطنية", intern.national_id))
    lines.append(row("البريد الإلكتروني", intern.email))
    lines.append(row("رقم الهاتف", intern.phone))
    lines.append(row("تاريخ الازدياد", intern.date_of_birth))
    lines.append(row("تاريخ البدء", intern.start_date))
    lines.append(row("تاريخ الانتهاء", intern.end_date))
    lines.append(row("الجامعة أو المعهد", intern.university))
    lines.append(row("القسم", intern.department))
    lines.append(row("المؤطر", intern.encadrant))
    lines.append(row("الحالة", intern.status))
    lines.append(row("العنوان", intern.address))
    lines.append("")
    lines.append("## المستندات")
    lines.append("")
    if docs:
        for k, v in docs.items():
            if k == 'others':
                continue
            if v:
                lines.append(f"- {k}: {v}")
    for o in others:
        if isinstance(o, dict) and o.get('file'):
            lines.append(f"- {o.get('name', 'مستند إضافي')}: {o.get('file')}")
    if not docs and not others:
        lines.append("- لا توجد مستندات.")
    lines.append("")
    return "\n".join(lines)

@app.route('/api/interns/<int:intern_id>/profile-md', methods=['GET'])
@jwt_required()
def download_profile_md(intern_id):
    intern = Intern.query.get(intern_id)
    if not intern:
        return jsonify({"msg": "Intern not found"}), 404
    md = render_intern_md(intern)
    buffer = io.BytesIO(md.encode('utf-8'))
    buffer.seek(0)
    return send_file(buffer, as_attachment=True, download_name=f"Profil_{intern.id}.md", mimetype='text/markdown')

@app.route('/api/interns/<int:intern_id>/profile-pdf', methods=['GET'])
@jwt_required()
def download_profile_pdf(intern_id):
    intern = Intern.query.get(intern_id)
    if not intern:
        return jsonify({"msg": "Intern not found"}), 404
    mode = request.args.get('mode', 'summary').lower()
    if mode not in ('summary', 'full'):
        mode = 'summary'
    disposition = request.args.get('disposition', 'attachment').lower()
    as_attachment = disposition != 'inline'
    try:
        from pdf_report import build_intern_pdf, build_filename
        buffer = build_intern_pdf([intern], mode=mode)
        filename = build_filename(intern)
    except ImportError:
        return jsonify({"msg": "PDF generation library not installed"}), 500
    return send_file(buffer, as_attachment=as_attachment, download_name=filename, mimetype='application/pdf')

@app.route('/api/interns/export', methods=['GET'])
@jwt_required()
def export_interns():
    current_user = get_jwt()
    if current_user.get('role') != 'Admin':
        return jsonify({"msg": "Unauthorized"}), 403

    fmt = request.args.get('format', 'pdf').lower()
    ids_param = request.args.get('ids')
    if ids_param:
        try:
            ids = [int(x) for x in ids_param.split(',') if x.strip()]
        except ValueError:
            return jsonify({"msg": "Invalid ids"}), 400
        interns = Intern.query.filter(Intern.id.in_(ids)).all()
    else:
        interns = Intern.query.all()

    if not interns:
        return jsonify({"msg": "No interns to export"}), 404

    if fmt == 'excel':
        try:
            import openpyxl
            from openpyxl.styles import Font, PatternFill, Alignment
            from openpyxl.utils import get_column_letter
        except ImportError:
            return jsonify({"msg": "Excel library not installed"}), 500

        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Interns"
        headers = ["ID", "الاسم", "الاسم (فرنسية)", "البريد", "الهاتف", "رقم الهوية",
                   "القسم", "المؤطر", "الحالة", "تاريخ البدء", "تاريخ الانتهاء",
                   "تاريخ الازدياد", "الجامعة", "العنوان"]
        ws.append(headers)
        header_fill = PatternFill(start_color="1E5631", end_color="1E5631", fill_type="solid")
        for col, _ in enumerate(headers, start=1):
            c = ws.cell(row=1, column=col)
            c.font = Font(bold=True, color="FFFFFF")
            c.fill = header_fill
            c.alignment = Alignment(horizontal="right", vertical="center")
        for i in interns:
            ws.append([
                i.id, i.name, i.name_fr, i.email, i.phone, i.national_id,
                i.department, i.encadrant, i.status, i.start_date, i.end_date,
                i.date_of_birth, i.university, i.address
            ])
        for col in range(1, len(headers) + 1):
            ws.column_dimensions[get_column_letter(col)].width = 18
        ws.column_dimensions['B'].width = 24
        ws.column_dimensions['N'].width = 30

        buffer = io.BytesIO()
        wb.save(buffer)
        buffer.seek(0)
        return send_file(buffer, as_attachment=True, download_name="Interns_Export.xlsx", mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

    # Default: PDF (one formal profile per page)
    try:
        from pdf_report import build_intern_pdf, build_filename
        buffer = build_intern_pdf(interns)
        filename = build_filename(interns[0]) if len(interns) == 1 else "Interns_Export.pdf"
    except ImportError:
        return jsonify({"msg": "PDF generation library not installed"}), 500
    return send_file(buffer, as_attachment=True, download_name=filename, mimetype='application/pdf')


# --- DOCUMENT LIFECYCLE ENDPOINTS ---

DOC_TYPE_LABELS = {
    'CIN': 'بطاقة التعريف الوطنية (CIN)',
    'CV': 'السيرة الذاتية (CV)',
    'INSURANCE': 'التأمين (Assurance)',
    'DEMANDE': 'طلب التدريب (Demande)',
    'CONVENTION_SIGNED': 'اتفاقية التدريب الموقعة',
    'FINAL_REPORT': 'التقرير النهائي',
    'ATTESTATION_SIGNED': 'شهادة التدريب الموقعة',
    'OTHER': 'مستند إضافي',
}

def _seed_doc_records(intern_id):
    """Ensure one DocumentLifecycle row exists per standard doc_type for this intern."""
    now = datetime.utcnow().isoformat()
    for dt in ['CIN', 'CV', 'INSURANCE', 'DEMANDE', 'CONVENTION_SIGNED', 'FINAL_REPORT', 'ATTESTATION_SIGNED']:
        existing = DocumentLifecycle.query.filter_by(intern_id=intern_id, doc_type=dt).filter(
            DocumentLifecycle.custom_title.is_(None)
        ).first()
        if not existing:
            dl = DocumentLifecycle(intern_id=intern_id, doc_type=dt, status='MISSING',
                                   created_at=now, updated_at=now)
            db.session.add(dl)
    db.session.commit()


def _get_doc_type_intern():
    """For intern-portal endpoints: return (intern, user_claims) from JWT matching Intern.email."""
    claims = get_jwt()
    role = claims.get('role')
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return None, None, None
    if role == 'Intern':
        intern = Intern.query.filter_by(email=user.email).first()
        return intern, claims, user
    return None, claims, user


@app.route('/api/interns/<int:intern_id>/documents', methods=['GET'])
@jwt_required()
def list_intern_documents(intern_id):
    intern = Intern.query.get(intern_id)
    if not intern:
        return jsonify({"msg": "Intern not found"}), 404
    _seed_doc_records(intern_id)
    docs = DocumentLifecycle.query.filter_by(intern_id=intern_id).order_by(DocumentLifecycle.doc_type).all()
    result = []
    for d in docs:
        result.append({
            "id": d.id,
            "doc_type": d.doc_type,
            "label": DOC_TYPE_LABELS.get(d.doc_type, d.custom_title or d.doc_type),
            "file_path": d.file_path,
            "uploaded_by": d.uploaded_by,
            "status": d.status,
            "rejection_reason": d.rejection_reason,
            "is_visible_to_intern": d.is_visible_to_intern,
            "custom_title": d.custom_title,
            "created_at": d.created_at,
            "updated_at": d.updated_at,
        })
    return jsonify(result), 200


@app.route('/api/interns/<int:intern_id>/documents/upload', methods=['POST'])
@jwt_required()
def upload_intern_document(intern_id):
    """Intern uploads a file for a given doc_type (creates or updates lifecycle record)."""
    intern, claims, user = _get_doc_type_intern()
    if not intern or intern.id != intern_id:
        current_user = get_jwt()
        if current_user.get('role') not in ('Admin',):
            return jsonify({"msg": "Unauthorized"}), 403
        intern = Intern.query.get(intern_id)
        if not intern:
            return jsonify({"msg": "Intern not found"}), 404

    doc_type = request.form.get('doc_type')
    if not doc_type or doc_type not in DOC_TYPES:
        return jsonify({"msg": "Invalid doc_type"}), 400

    if 'file' not in request.files:
        return jsonify({"msg": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"msg": "No selected file"}), 400

    if not file.filename.lower().endswith('.pdf'):
        return jsonify({"msg": "PDF files only"}), 400
    file.seek(0, os.SEEK_END)
    size = file.tell()
    file.seek(0)
    if size > 15 * 1024 * 1024:
        return jsonify({"msg": "File too large (max 15MB)"}), 400

    filename = safe_filename('doc', file.filename)
    if not filename.lower().endswith('.pdf'):
        filename += '.pdf'
    file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
    file_url = f"/api/uploads/{filename}"

    custom_title = request.form.get('custom_title')
    now = datetime.utcnow().isoformat()

    record = DocumentLifecycle.query.filter_by(
        intern_id=intern.id, doc_type=doc_type
    ).filter(
        DocumentLifecycle.custom_title.is_(None) if not custom_title else DocumentLifecycle.custom_title == custom_title
    ).first()

    if not record:
        record = DocumentLifecycle(
            intern_id=intern.id, doc_type=doc_type,
            status='PENDING_REVIEW', file_path=file_url,
            uploaded_by='INTERN', is_visible_to_intern=False,
            custom_title=custom_title, created_at=now, updated_at=now
        )
        db.session.add(record)
    else:
        record.file_path = file_url
        record.status = 'PENDING_REVIEW'
        record.uploaded_by = 'INTERN'
        record.is_visible_to_intern = False
        record.rejection_reason = None
        record.updated_at = now

    db.session.commit()

    # Auto-fulfill any pending DocumentRequest for this doc_type
    if not custom_title:
        DocumentRequest.query.filter_by(
            intern_id=intern.id, document_type=doc_type, status='pending'
        ).update({'status': 'fulfilled'})

    return jsonify({"msg": "Uploaded successfully", "doc": {
        "id": record.id, "doc_type": record.doc_type, "status": record.status,
        "file_path": record.file_path
    }}), 200


@app.route('/api/interns/<int:intern_id>/documents/<int:doc_id>/approve', methods=['POST'])
@jwt_required()
def approve_document(intern_id, doc_id):
    current_user = get_jwt()
    if current_user.get('role') not in ('Admin', 'Manager'):
        return jsonify({"msg": "Unauthorized"}), 403
    doc = DocumentLifecycle.query.filter_by(id=doc_id, intern_id=intern_id).first()
    if not doc:
        return jsonify({"msg": "Document not found"}), 404
    doc.status = 'APPROVED_AND_SIGNED'
    doc.is_visible_to_intern = True
    doc.updated_at = datetime.utcnow().isoformat()
    db.session.commit()
    intern = Intern.query.get(intern_id)
    log_action(current_user.get('name'), f"قبول مستند ({doc.doc_type}) للمتدرب {intern.name if intern else ''}")
    return jsonify({"success": True, "status": doc.status}), 200


@app.route('/api/interns/<int:intern_id>/documents/<int:doc_id>/reject', methods=['POST'])
@jwt_required()
def reject_document(intern_id, doc_id):
    current_user = get_jwt()
    if current_user.get('role') not in ('Admin', 'Manager'):
        return jsonify({"msg": "Unauthorized"}), 403
    doc = DocumentLifecycle.query.filter_by(id=doc_id, intern_id=intern_id).first()
    if not doc:
        return jsonify({"msg": "Document not found"}), 404
    data = request.json or {}
    reason = data.get('rejection_reason', '')
    doc.status = 'REVISION_REQUESTED'
    doc.rejection_reason = reason
    doc.is_visible_to_intern = False
    doc.updated_at = datetime.utcnow().isoformat()
    db.session.commit()
    intern = Intern.query.get(intern_id)
    log_action(current_user.get('name'), f"إعادة مستند ({doc.doc_type}) للمتدرب {intern.name if intern else ''}: {reason}")
    return jsonify({"success": True, "status": doc.status}), 200


@app.route('/api/interns/<int:intern_id>/documents/signed', methods=['POST'])
@jwt_required()
def upload_signed_document(intern_id):
    """Admin uploads a signed/approved version of a document (outgoing to intern)."""
    current_user = get_jwt()
    if current_user.get('role') not in ('Admin', 'Manager'):
        return jsonify({"msg": "Unauthorized"}), 403
    intern = Intern.query.get(intern_id)
    if not intern:
        return jsonify({"msg": "Intern not found"}), 404

    doc_type = request.form.get('doc_type')
    if not doc_type or doc_type not in DOC_TYPES:
        return jsonify({"msg": "Invalid doc_type"}), 400

    if 'file' not in request.files:
        return jsonify({"msg": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"msg": "No selected file"}), 400

    if not file.filename.lower().endswith('.pdf'):
        return jsonify({"msg": "PDF files only"}), 400
    file.seek(0, os.SEEK_END)
    size = file.tell()
    file.seek(0)
    if size > 15 * 1024 * 1024:
        return jsonify({"msg": "File too large (max 15MB)"}), 400

    filename = safe_filename('signed', file.filename)
    if not filename.lower().endswith('.pdf'):
        filename += '.pdf'
    file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
    file_url = f"/api/uploads/{filename}"

    now = datetime.utcnow().isoformat()
    existing = DocumentLifecycle.query.filter_by(intern_id=intern.id, doc_type=doc_type).filter(
        DocumentLifecycle.custom_title.is_(None)
    ).first()
    if existing:
        existing.file_path = file_url
        existing.status = 'APPROVED_AND_SIGNED'
        existing.uploaded_by = 'ADMIN'
        existing.is_visible_to_intern = True
        existing.updated_at = now
        db.session.commit()
        log_action(current_user.get('name'), f"رفع نسخة موقعة من {doc_type} للمتدرب {intern.name}")
        return jsonify({"msg": "Signed document uploaded", "doc_id": existing.id}), 200

    record = DocumentLifecycle(
        intern_id=intern.id, doc_type=doc_type, file_path=file_url,
        uploaded_by='ADMIN', status='APPROVED_AND_SIGNED',
        is_visible_to_intern=True, created_at=now, updated_at=now
    )
    db.session.add(record)
    db.session.commit()
    log_action(current_user.get('name'), f"رفع نسخة موقعة من {doc_type} للمتدرب {intern.name}")
    return jsonify({"msg": "Signed document uploaded", "doc_id": record.id}), 201


@app.route('/api/intern-documents/<int:doc_id>/download', methods=['GET'])
def download_intern_document(doc_id):
    """Secure download: intern can only download if is_visible_to_intern or they uploaded it."""
    doc = DocumentLifecycle.query.get(doc_id)
    if not doc or not doc.file_path:
        return jsonify({"msg": "Document not found"}), 404

    # Determine requester role
    token = request.args.get('token')
    intern_identity = None
    is_admin = False
    if token:
        try:
            from flask_jwt_extended import decode_token
            decoded = decode_token(token)
            claims = decoded.get('additional_claims', {})
            is_admin = claims.get('role') in ('Admin', 'Manager')
            if claims.get('role') == 'Intern':
                user = User.query.get(int(decoded.get('sub', 0)))
                if user:
                    intern_identity = Intern.query.filter_by(email=user.email).first()
        except Exception:
            pass

    if not is_admin:
        if not intern_identity or intern_identity.id != doc.intern_id:
            return jsonify({"msg": "Unauthorized"}), 403
        if not doc.is_visible_to_intern and doc.uploaded_by == 'ADMIN':
            return jsonify({"msg": "Unauthorized"}), 403

    name = doc.file_path.replace('/api/uploads/', '').replace('/', '')
    return send_from_directory(app.config['UPLOAD_FOLDER'], name)


@app.route('/api/intern/documents', methods=['GET'])
@jwt_required()
def list_my_documents():
    """Intern portal: list all documents visible to the intern."""
    intern, claims, user = _get_doc_type_intern()
    if not intern:
        return jsonify({"msg": "Intern not found"}), 404
    _seed_doc_records(intern.id)
    docs = DocumentLifecycle.query.filter_by(intern_id=intern.id).order_by(DocumentLifecycle.doc_type).all()
    result = []
    for d in docs:
        entry = {
            "id": d.id,
            "doc_type": d.doc_type,
            "label": DOC_TYPE_LABELS.get(d.doc_type, d.custom_title or d.doc_type),
            "file_path": d.file_path,
            "uploaded_by": d.uploaded_by,
            "status": d.status,
            "rejection_reason": d.rejection_reason,
            "is_visible_to_intern": d.is_visible_to_intern,
            "custom_title": d.custom_title,
            "created_at": d.created_at,
            "updated_at": d.updated_at,
        }
        result.append(entry)
    return jsonify(result), 200


# --- ZIP ARCHIVE EXPORT ---

@app.route('/api/interns/<int:intern_id>/export-zip', methods=['GET'])
@jwt_required()
def export_intern_zip(intern_id):
    current_user = get_jwt()
    if current_user.get('role') not in ('Admin', 'Manager'):
        return jsonify({"msg": "Unauthorized"}), 403
    intern = Intern.query.get(intern_id)
    if not intern:
        return jsonify({"msg": "Intern not found"}), 404
    import tempfile, zipfile
    docs = DocumentLifecycle.query.filter_by(intern_id=intern_id).filter(
        DocumentLifecycle.file_path.isnot(None)
    ).all()
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix='.zip')
    with zipfile.ZipFile(tmp, 'w', zipfile.ZIP_DEFLATED) as zf:
        for d in docs:
            fname = d.file_path.replace('/api/uploads/', '').replace('/', '')
            fpath = os.path.join(app.config['UPLOAD_FOLDER'], fname)
            if os.path.exists(fpath):
                arcname = f"{d.doc_type or 'doc'}_{d.id}_{fname}"
                zf.write(fpath, arcname)
    tmp.close()
    return send_file(tmp.name, as_attachment=True, download_name=f"Intern_{intern_id}_Archive.zip", mimetype='application/zip')


if __name__ == '__main__':
    init_db()
    app.run(port=5055, debug=True)
