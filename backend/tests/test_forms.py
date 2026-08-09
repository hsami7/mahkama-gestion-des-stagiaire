def test_get_forms(client, admin_token):
    res = client.get('/api/forms', headers={'Authorization': f'Bearer {admin_token}'})
    assert res.status_code == 200
    assert type(res.json) == list

def test_add_form(client, admin_token):
    data = {
        'title': 'Test Form',
        'fields': '[{"name": "field1", "type": "text"}]',
        'is_active': True
    }
    res = client.post('/api/forms', json=data, headers={'Authorization': f'Bearer {admin_token}'})
    assert res.status_code == 200
    assert res.json['success'] is True
    assert 'id' in res.json
