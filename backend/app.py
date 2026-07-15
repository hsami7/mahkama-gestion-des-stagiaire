import sqlite3
import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity

app = Flask(__name__)
CORS(app)

# Configurations
app.config['JWT_SECRET_KEY'] = 'mahkama-secret-key-2026' # Change in production
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'uploads')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024 # 16MB max upload

jwt = JWTManager(app)
DB_PATH = 'database.sqlite'

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    # Users/Roles
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT UNIQUE,
            password TEXT,
            role TEXT,
            permissions TEXT
        )
    ''')
    # Interns
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS interns (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT,
            department TEXT,
            status TEXT DEFAULT 'قيد المراجعة',
            photo_path TEXT
        )
    ''')
    # Custom Forms
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS forms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            form_data TEXT
        )
    ''')
    
    # Create default Admin user if none exists
    cursor.execute("SELECT * FROM users WHERE email='admin@mahkama.ma'")
    if not cursor.fetchone():
        hashed_pw = generate_password_hash('admin123')
        cursor.execute("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
                       ('مدير النظام', 'admin@mahkama.ma', hashed_pw, 'Admin'))
                       
    conn.commit()
    conn.close()

# --- AUTHENTICATION ROUTES ---
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, password, role FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()
    conn.close()
    
    if user and check_password_hash(user[2], password):
        access_token = create_access_token(identity={'id': user[0], 'name': user[1], 'role': user[3]})
        return jsonify(access_token=access_token, user={'id': user[0], 'name': user[1], 'role': user[3]}), 200
        
    return jsonify({"msg": "البريد الإلكتروني أو كلمة المرور غير صحيحة"}), 401

# --- INTERN ROUTES ---
@app.route('/api/interns', methods=['GET'])
def get_interns():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, email, department, status FROM interns")
    rows = cursor.fetchall()
    interns = [{"id": r[0], "name": r[1], "email": r[2], "department": r[3], "status": r[4]} for r in rows]
    conn.close()
    return jsonify(interns)

@app.route('/api/interns', methods=['POST'])
@jwt_required()
def add_intern():
    data = request.json
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("INSERT INTO interns (name, email, department) VALUES (?, ?, ?)", 
                   (data.get('name'), data.get('email'), data.get('department')))
    conn.commit()
    intern_id = cursor.lastrowid
    conn.close()
    return jsonify({"success": True, "id": intern_id})

# --- DOCUMENT VAULT ROUTES ---
@app.route('/api/documents', methods=['GET'])
@jwt_required()
def list_documents():
    files = []
    if os.path.exists(app.config['UPLOAD_FOLDER']):
        for filename in os.listdir(app.config['UPLOAD_FOLDER']):
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            if os.path.isfile(filepath):
                files.append({
                    "name": filename,
                    "size": os.path.getsize(filepath)
                })
    return jsonify(files)

@app.route('/api/documents', methods=['POST'])
@jwt_required()
def upload_document():
    if 'file' not in request.files:
        return jsonify({"msg": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"msg": "No selected file"}), 400
        
    if file:
        filename = secure_filename(file.filename)
        # Fallback if secure_filename strips Arabic chars completely
        if not filename:
            filename = "doc_" + file.filename
            
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        return jsonify({"msg": "تم رفع الملف بنجاح", "filename": filename}), 201

@app.route('/api/documents/<filename>', methods=['GET'])
def download_document(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

if __name__ == '__main__':
    if not os.path.exists(DB_PATH):
        init_db()
    else:
        # Run init_db anyway to ensure new columns/admin user exist if we modified schema
        try:
            init_db()
        except sqlite3.OperationalError:
            # Table already exists but might need migration, doing simple ignore for now
            pass
            
    app.run(port=5000, debug=True)
