import sqlite3
from flask import Flask, request, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

DB_PATH = 'database.sqlite'

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    # Users/Roles
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
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
    conn.commit()
    conn.close()

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

if __name__ == '__main__':
    if not os.path.exists(DB_PATH):
        init_db()
    app.run(port=5000, debug=True)
