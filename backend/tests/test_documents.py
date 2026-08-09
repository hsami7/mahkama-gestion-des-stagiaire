def test_get_vault(client, admin_token):
    res = client.get('/api/vault', headers={'Authorization': f'Bearer {admin_token}'})
    assert res.status_code == 200
    assert type(res.json) == list

def test_add_document(client, admin_token, tmp_path):
    # Add an intern first to attach document to
    intern_res = client.post('/api/interns', json={'name': 'Doc Intern'}, headers={'Authorization': f'Bearer {admin_token}'})
    intern_id = intern_res.json['id']
    
    # Upload a document
    file_path = tmp_path / "test_doc.pdf"
    file_path.write_bytes(b"test pdf content")
    
    with open(file_path, "rb") as f:
        data = {
            'file': (f, 'test_doc.pdf'),
            'type': 'cv',
            'intern_id': str(intern_id)
        }
        res = client.post('/api/vault', data=data, headers={'Authorization': f'Bearer {admin_token}'})
        
    assert res.status_code == 201
    assert res.json['success'] is True

def test_document_requests(client, admin_token):
    res = client.get('/api/documents/queue', headers={'Authorization': f'Bearer {admin_token}'})
    assert res.status_code == 200
    assert type(res.json) == list
