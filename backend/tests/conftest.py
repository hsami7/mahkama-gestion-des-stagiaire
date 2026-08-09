import pytest
import os
import sys

# Ensure backend directory is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app as flask_app
from extensions import db as _db
from models import User
from werkzeug.security import generate_password_hash

@pytest.fixture
def app():
    # Setup in-memory DB and test config
    flask_app.config.update({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        "WTF_CSRF_ENABLED": False,
        "JWT_SECRET_KEY": "test-secret"
    })
    
    with flask_app.app_context():
        _db.create_all()
        
        # Create an admin user for testing if it doesn't exist
        admin = User.query.filter_by(username='admin').first()
        if not admin:
            hashed_pw = generate_password_hash('admin123')
            admin = User(username='admin', name='Admin', password=hashed_pw, role='Admin')
            _db.session.add(admin)
        
        # Create an intern manager user
        manager_pw = generate_password_hash('manager123')
        manager = User(username='manager', name='Manager', password=manager_pw, role='Manager', can_manage_documents=True)
        _db.session.add(manager)
        
        _db.session.commit()
        
        yield flask_app
        
        _db.session.remove()
        _db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def admin_token(client):
    res = client.post('/api/login', json={'username': 'admin', 'password': 'admin123'})
    return res.json['access_token']

@pytest.fixture
def manager_token(client):
    res = client.post('/api/login', json={'username': 'manager', 'password': 'manager123'})
    return res.json['access_token']
