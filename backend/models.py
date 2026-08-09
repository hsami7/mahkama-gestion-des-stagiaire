from extensions import db
from datetime import datetime, timezone, date
import json

# --- MODELS ---
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    name = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=True)
    password = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(50), nullable=False)
    permissions = db.Column(db.Text, nullable=True)
    can_manage_documents = db.Column(db.Boolean, default=False)

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
    source = db.Column(db.String(100), default='إضافة يدوية')
    photo_path = db.Column(db.String(255), nullable=True)
    phone = db.Column(db.String(50), nullable=True)
    start_date = db.Column(db.Date, nullable=True)
    end_date = db.Column(db.Date, nullable=True)
    date_of_birth = db.Column(db.Date, nullable=True)
    university = db.Column(db.String(150), nullable=True)
    specialty = db.Column(db.String(150), nullable=True)
    address = db.Column(db.Text, nullable=True)
    documents = db.Column(db.Text, nullable=True)
    evaluation = db.Column(db.Text, nullable=True)

class BlacklistedIntern(db.Model):
    __tablename__ = 'blacklisted_interns'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    identifier = db.Column(db.String(150), unique=True, nullable=False) # email or phone
    deleted_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

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
    lifecycle_id = db.Column(db.Integer, db.ForeignKey('document_lifecycle.id'), nullable=True)
class Form(db.Model):
    __tablename__ = 'forms'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    form_data = db.Column(db.Text, nullable=False)
    title = db.Column(db.String(200), nullable=True)
    slug = db.Column(db.String(50), unique=True, nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.String(50), nullable=True)

class FormSubmission(db.Model):
    __tablename__ = 'form_submissions'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    form_id = db.Column(db.Integer, db.ForeignKey('forms.id'), nullable=False)
    submitted_data = db.Column(db.Text, nullable=False)  # JSON string
    status = db.Column(db.String(20), default='pending')  # pending | approved | rejected
    submitted_at = db.Column(db.String(50), nullable=True)
    rejection_reason = db.Column(db.Text, nullable=True)
    intern_id = db.Column(db.Integer, db.ForeignKey('interns.id'), nullable=True)

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

class Notification(db.Model):
    __tablename__ = 'notifications'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    intern_id = db.Column(db.Integer, db.ForeignKey('interns.id'), nullable=False)
    type = db.Column(db.String(50), nullable=False) # REJECTION, REASSIGNMENT, REQUEST, STAGE_COMPLETE, GENERIC
    title = db.Column(db.String(200), nullable=False)
    body = db.Column(db.Text, nullable=True)
    related_doc_id = db.Column(db.Integer, db.ForeignKey('document_lifecycle.id'), nullable=True)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

class AuditEvent(db.Model):
    __tablename__ = 'audit_events'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    actor_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    actor_role = db.Column(db.String(50), nullable=True)
    action = db.Column(db.String(255), nullable=False)
    doc_id = db.Column(db.Integer, db.ForeignKey('document_lifecycle.id'), nullable=True)
    from_status = db.Column(db.String(50), nullable=True)
    to_status = db.Column(db.String(50), nullable=True)
    note = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Legacy known doc_types — kept for backward compatibility only. New documents
# can use an arbitrary doc_type ('OTHER' by default) so that admins/interns can
# request any document by name. Labels are derived from DocumentLifecycle.custom_title.
DOC_TYPES = [
    'CIN', 'CV', 'INSURANCE', 'DEMANDE', 'CONVENTION_SIGNED',
    'FINAL_REPORT', 'ATTESTATION_SIGNED', 'OTHER'
]
DOC_STATUSES = ['MISSING', 'AWAITING_RETURN', 'RETURNED', 'PENDING_REVIEW', 'REVISION_REQUESTED', 'APPROVED_AND_SIGNED', 'AWAITING_ADMIN', 'AWAITING_INTERN']

# Allowed file types for a requested/uploaded document. Maps the value stored on
# DocumentLifecycle.file_type to the set of extensions the server will accept.
FILE_TYPE_EXTENSIONS = {
    'pdf':   ['.pdf'],
    'word':  ['.doc', '.docx'],
    'excel': ['.xls', '.xlsx'],
    'image': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'],
    'any':   ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'],
}
# What the document should be used for — drives lifecycle behaviour.
ACTION_TYPES = {'sign', 'fill', 'sign_fill', 'view', 'view_or_return'}

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
    requires_return = db.Column(db.Boolean, default=False)
    returned_file_path = db.Column(db.String(255), nullable=True)
    returned_files_history = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, nullable=True)
    updated_at = db.Column(db.DateTime, nullable=True)
    lifecycle_type = db.Column(db.String(20), default='SIGN')
    form_schema = db.Column(db.Text, nullable=True)
    form_data = db.Column(db.Text, nullable=True)
    assigned_to_intern_id = db.Column(db.Integer, db.ForeignKey('interns.id'), nullable=True)
    signed_by = db.Column(db.String(150), nullable=True)
    correction_round = db.Column(db.Integer, default=0)
    parent_id = db.Column(db.Integer, db.ForeignKey('document_lifecycle.id'), nullable=True)
    file_type = db.Column(db.String(20), default='pdf')
    action_type = db.Column(db.String(20), default='view')
    requested_by = db.Column(db.String(20), default='ADMIN')
    revision_requested_by = db.Column(db.String(20), nullable=True)
    source = db.Column(db.String(20), default='ADMIN')

    intern = db.relationship('Intern', foreign_keys=[intern_id], backref='documents_lifecycle')
    assigned_to = db.relationship('Intern', foreign_keys=[assigned_to_intern_id])
    parent = db.relationship('DocumentLifecycle', remote_side=[id])

class DocumentTemplate(db.Model):
    __tablename__ = 'document_templates'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    label = db.Column(db.String(150), nullable=False)
    file_type = db.Column(db.String(20), default='pdf')
    file_path = db.Column(db.String(255), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

