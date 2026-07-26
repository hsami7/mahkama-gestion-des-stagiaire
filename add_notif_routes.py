import re

with open('backend/app.py', 'r', encoding='utf-8') as f:
    text = f.read()

new_routes = """
@app.route('/api/intern/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    current_user = get_jwt()
    # In this app, Interns and Users are decoupled somewhat, but assuming user.role == 'Intern' matches intern_id.
    # We will fetch by email or we need intern id. For now we will allow passing intern_id as query param for simplicity,
    # or look it up by email.
    intern_id = request.args.get('intern_id')
    if not intern_id:
        # Try to find intern by email
        user = db.session.get(User, current_user.get('sub'))
        if user:
            intern = Intern.query.filter_by(email=user.email).first()
            if intern:
                intern_id = intern.id
    
    if not intern_id:
        return jsonify({"msg": "Intern ID required"}), 400
        
    notifs = Notification.query.filter_by(intern_id=intern_id).order_by(Notification.is_read, Notification.created_at.desc()).all()
    return jsonify([{
        "id": n.id,
        "type": n.type,
        "title": n.title,
        "body": n.body,
        "related_doc_id": n.related_doc_id,
        "is_read": n.is_read,
        "created_at": n.created_at.isoformat() if n.created_at else None
    } for n in notifs])

@app.route('/api/intern/notifications/<int:nid>/read', methods=['POST'])
@jwt_required()
def read_notification(nid):
    n = db.session.get(Notification, nid)
    if not n:
        return jsonify({"msg": "Not found"}), 404
    n.is_read = True
    db.session.commit()
    return jsonify({"success": True})
"""

# Find a good place to insert the new routes. E.g., before "# --- NEW DOCUMENT WORKFLOW ROUTES ---"
if "# --- NEW DOCUMENT WORKFLOW ROUTES ---" in text:
    text = text.replace("# --- NEW DOCUMENT WORKFLOW ROUTES ---", new_routes + "\n# --- NEW DOCUMENT WORKFLOW ROUTES ---")
else:
    text += new_routes

with open('backend/app.py', 'w', encoding='utf-8') as f:
    f.write(text)
print("Routes added.")
