def test_login_success(client):
    res = client.post('/api/login', json={'username': 'admin', 'password': 'admin123'})
    assert res.status_code == 200
    assert 'access_token' in res.json
    assert res.json['user']['role'] == 'Admin'

def test_login_failure(client):
    res = client.post('/api/login', json={'username': 'admin', 'password': 'wrongpassword'})
    assert res.status_code == 401
    assert res.json['msg'] == 'اسم المستخدم أو كلمة المرور غير صحيحة'

def test_get_me(client, admin_token):
    res = client.get('/api/auth/me', headers={'Authorization': f'Bearer {admin_token}'})
    assert res.status_code == 200
    assert res.json['username'] == 'admin'

def test_get_users_admin(client, admin_token):
    res = client.get('/api/users', headers={'Authorization': f'Bearer {admin_token}'})
    assert res.status_code == 200
    assert len(res.json) >= 2 # admin and manager

def test_get_users_manager_forbidden(client, manager_token):
    res = client.get('/api/users', headers={'Authorization': f'Bearer {manager_token}'})
    assert res.status_code == 403
