import sys
import json
import zipfile
import io

from app import app, db, Intern, DocumentLifecycle, export_intern_zip

with app.app_context():
    interns = Intern.query.all()
    if not interns:
        print("No interns found.")
        sys.exit(0)
    
    intern = interns[0]
    print(intern.id)
    
    # We can mock get_jwt or just call the logic. 
    # But export_intern_zip has @jwt_required()
    # It's easier to use test_client and login, wait we need the password.
    # Let's just create an access token for admin manually.
    
    from flask_jwt_extended import create_access_token
    token = create_access_token(identity="admin", additional_claims={"role": "Admin"})
    
    client = app.test_client()
    res = client.get(f'/api/interns/{intern.id}/export-zip', headers={'Authorization': f'Bearer {token}'})
    
    print(f"Status Code: {res.status_code}")
    print(f"Content-Disposition: {res.headers.get('Content-Disposition')}")
    
    if res.status_code == 200:
        try:
            with zipfile.ZipFile(io.BytesIO(res.data)) as zf:
                print("\nZIP Contents:")
                for info in zf.infolist():
                    print(f"- {info.filename}")
        except Exception as e:
            print(f"Failed to parse ZIP: {e}")


