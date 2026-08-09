import sqlite3
import os

def migrate_db():
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'instance', 'database.sqlite')
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Try adding name_fr
    try:
        cursor.execute("ALTER TABLE interns ADD COLUMN name_fr VARCHAR(150)")
        print("Added name_fr to interns table.")
    except sqlite3.OperationalError as e:
        print(f"name_fr might already exist: {e}")
        
    # Try adding encadrant
    try:
        cursor.execute("ALTER TABLE interns ADD COLUMN encadrant VARCHAR(150)")
        print("Added encadrant to interns table.")
    except sqlite3.OperationalError as e:
        print(f"encadrant might already exist: {e}")
        
    # Create Attendance table
    try:
        cursor.execute("""
        CREATE TABLE attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            intern_id INTEGER NOT NULL,
            date VARCHAR(20) NOT NULL,
            status VARCHAR(20) NOT NULL,
            FOREIGN KEY(intern_id) REFERENCES interns(id)
        )
        """)
        print("Created attendance table.")
    except sqlite3.OperationalError as e:
        print(f"attendance table might already exist: {e}")

    # Create document_requests table
    try:
        cursor.execute("""
        CREATE TABLE document_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            intern_id INTEGER NOT NULL,
            document_type VARCHAR(50) NOT NULL,
            custom_title VARCHAR(150),
            note TEXT,
            status VARCHAR(20) DEFAULT 'pending',
            created_at VARCHAR(50) NOT NULL,
            FOREIGN KEY(intern_id) REFERENCES interns(id)
        )
        """)
        print("Created document_requests table.")
    except sqlite3.OperationalError as e:
        print(f"document_requests table might already exist: {e}")

    conn.commit()
    conn.close()

if __name__ == '__main__':
    migrate_db()
