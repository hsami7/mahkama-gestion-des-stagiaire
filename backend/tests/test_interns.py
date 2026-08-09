def test_add_intern(client, admin_token):
    data = {
        'name': 'Test Intern',
        'email': 'intern@test.com',
        'department': 'IT',
        'source': 'Manual'
    }
    res = client.post('/api/interns', json=data, headers={'Authorization': f'Bearer {admin_token}'})
    assert res.status_code == 200
    assert res.json['success'] is True
    assert 'id' in res.json

def test_get_interns(client, admin_token):
    res = client.get('/api/interns', headers={'Authorization': f'Bearer {admin_token}'})
    assert res.status_code == 200
    assert type(res.json) == list

def test_update_intern(client, admin_token):
    # First add one
    add_res = client.post('/api/interns', json={'name': 'To Update'}, headers={'Authorization': f'Bearer {admin_token}'})
    intern_id = add_res.json['id']
    
    # Update it
    update_res = client.put(f'/api/interns/{intern_id}', json={'name': 'Updated Name'}, headers={'Authorization': f'Bearer {admin_token}'})
    assert update_res.status_code == 200
    
    # Get it
    get_res = client.get(f'/api/interns/{intern_id}', headers={'Authorization': f'Bearer {admin_token}'})
    assert get_res.json['name'] == 'Updated Name'

def test_delete_intern(client, admin_token):
    # Add one
    add_res = client.post('/api/interns', json={'name': 'To Delete'}, headers={'Authorization': f'Bearer {admin_token}'})
    intern_id = add_res.json['id']
    
    # Delete it
    del_res = client.delete(f'/api/interns/{intern_id}', headers={'Authorization': f'Bearer {admin_token}'})
    assert del_res.status_code == 200
    
    # Verify it is gone
    get_res = client.get(f'/api/interns/{intern_id}', headers={'Authorization': f'Bearer {admin_token}'})
    assert get_res.status_code == 404
