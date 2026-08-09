import sqlite3
import os

db_path = os.path.join('backend', 'database.sqlite')
print(f"Connecting to {db_path}...")
try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()
    print("Tables in database:", [t[0] for t in tables])
    
    if 'interns' in [t[0] for t in tables]:
        cursor.execute("SELECT id, name, email, department, status FROM interns")
        interns = cursor.fetchall()
        print("\nRegistered Interns:")
        for intern in interns:
            print(intern)
    else:
        print("\nTable 'interns' does not exist yet.")
        
    if 'users' in [t[0] for t in tables]:
        cursor.execute("SELECT id, name, email, role FROM users")
        users = cursor.fetchall()
        print("\nRegistered Users:")
        for user in users:
            print(user)
except Exception as e:
    print("Error:", e)
