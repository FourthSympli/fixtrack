def register_and_get_headers(client, email="staff@shop.com"):
    res = client.post(
        "/api/auth/register",
        json={
            "full_name": "Sam Technician",
            "email": email,
            "password": "password123",
        },
    )
    assert res.status_code == 201
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_register_login_and_auth_guard(client):
    # Unauthenticated access is blocked
    unauth = client.get("/api/customers")
    assert unauth.status_code == 401

    headers = register_and_get_headers(client, "alex@shop.com")

    # Verify /me
    me = client.get("/api/auth/me", headers=headers)
    assert me.status_code == 200
    assert me.json()["email"] == "alex@shop.com"

    # Login with valid credentials
    login = client.post(
        "/api/auth/login",
        json={"email": "alex@shop.com", "password": "password123"},
    )
    assert login.status_code == 200
    assert "access_token" in login.json()

    # Login with wrong password
    bad_login = client.post(
        "/api/auth/login",
        json={"email": "alex@shop.com", "password": "wrong"},
    )
    assert bad_login.status_code == 401


def test_customer_crud_and_search(client):
    headers = register_and_get_headers(client)

    created = client.post(
        "/api/customers",
        headers=headers,
        json={
            "name": "Taylor Swift",
            "phone": "415-555-0101",
            "email": "taylor@example.com",
            "address": "101 Main St",
            "notes": "VIP",
        },
    )
    assert created.status_code == 201
    cid = created.json()["id"]

    # Search
    search_res = client.get("/api/customers?search=Taylor", headers=headers)
    assert search_res.status_code == 200
    assert len(search_res.json()) == 1

    # Update
    updated = client.put(
        f"/api/customers/{cid}",
        headers=headers,
        json={
            "name": "Taylor S.",
            "phone": "415-555-0102",
            "email": "taylor@example.com",
            "address": "102 Main St",
            "notes": "",
        },
    )
    assert updated.status_code == 200
    assert updated.json()["name"] == "Taylor S."

    # Delete
    deleted = client.delete(f"/api/customers/{cid}", headers=headers)
    assert deleted.status_code == 200


def test_device_repair_status_and_payment_workflow(client):
    headers = register_and_get_headers(client)

    cust = client.post(
        "/api/customers",
        headers=headers,
        json={"name": "Jordan Lee", "phone": "415-555-0199"},
    ).json()

    dev = client.post(
        "/api/devices",
        headers=headers,
        json={
            "customer_id": cust["id"],
            "device_type": "Phone",
            "brand": "Apple",
            "model": "iPhone 15",
            "serial_number": "SN12345",
        },
    )
    assert dev.status_code == 201
    dev_id = dev.json()["id"]

    repair = client.post(
        "/api/repairs",
        headers=headers,
        json={
            "customer_id": cust["id"],
            "device_id": dev_id,
            "issue_description": "Cracked glass digitizer replacement",
            "estimated_cost": 180.0,
            "amount_paid": 50.0,
        },
    )
    assert repair.status_code == 201
    rep_data = repair.json()
    assert rep_data["status"] == "Received"
    assert rep_data["payment_status"] == "Partial"

    # Progress to Ready and pay in full
    patched = client.patch(
        f"/api/repairs/{rep_data['id']}",
        headers=headers,
        json={"status": "Ready", "amount_paid": 180.0},
    )
    assert patched.status_code == 200
    assert patched.json()["status"] == "Ready"
    assert patched.json()["payment_status"] == "Paid"

    # Dashboard reflects metrics
    stats = client.get("/api/dashboard/stats", headers=headers)
    assert stats.status_code == 200
    assert stats.json()["total_repairs"] == 1
    assert stats.json()["total_revenue_collected"] == 180.0
