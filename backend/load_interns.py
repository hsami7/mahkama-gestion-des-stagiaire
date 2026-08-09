import json
import sqlite3
import os

db_path = 'instance/database.sqlite'
json_path = '../interns_output.json'

try:
    with open(json_path, 'r', encoding='utf-8') as f:
        interns_data = json.load(f)
        
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    for intern in interns_data:
        # Check if intern already exists by email
        cursor.execute("SELECT id FROM interns WHERE email=?", (intern.get('email'),))
        if not cursor.fetchone():
            cursor.execute("""
                INSERT INTO interns (name, email, department, status, phone, start_date, end_date, date_of_birth, university, address, documents)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                intern.get('name'),
                intern.get('email'),
                intern.get('department'),
                intern.get('status'),
                intern.get('phone'),
                intern.get('start_date'),
                intern.get('end_date'),
                intern.get('date_of_birth'),
                intern.get('university'),
                intern.get('address'),
                intern.get('documents')
            ))
            print(f"Added intern: {intern.get('name')}")
        else:
            print(f"Intern already exists: {intern.get('name')}")
            
    conn.commit()
    print("Database updated successfully!")
    
except Exception as e:
    print("Error:", e)
