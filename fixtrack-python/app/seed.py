from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session

from app.auth import hash_password
from app.models import Customer, Device, RepairRequest, User


def seed_sample_data(db: Session) -> None:
    """Populate initial demo staff user and sample mobile/laptop repairs if DB is empty."""
    if db.query(User).first() is None:
        demo_user = User(
            full_name="Alex Rivera",
            email="tech@fixtrack.local",
            hashed_password=hash_password("fixtrack123"),
        )
        db.add(demo_user)
        db.commit()

    if db.query(Customer).first() is not None:
        return

    now = datetime.now(timezone.utc)

    def days_ago(n: int) -> datetime:
        return now - timedelta(days=n)

    customers = [
        Customer(
            name="Maya Lin",
            phone="(415) 555-0142",
            email="maya.lin@example.com",
            address="412 Maple Street, Apt 4B",
            notes="Prefers SMS updates when device is ready.",
            created_at=days_ago(18),
        ),
        Customer(
            name="Jordan Brooks",
            phone="(415) 555-0198",
            email="j.brooks@example.com",
            address="890 Oakridge Ave",
            notes="Student rush request.",
            created_at=days_ago(14),
        ),
        Customer(
            name="Elena Vance",
            phone="(415) 555-0231",
            email="elena.vance@example.com",
            address="125 Pinecrest Blvd",
            notes="Brings multiple family devices.",
            created_at=days_ago(10),
        ),
        Customer(
            name="Marcus Chen",
            phone="(415) 555-0277",
            email="mchen@example.com",
            address="77 Cedar Lane",
            notes="",
            created_at=days_ago(5),
        ),
    ]
    db.add_all(customers)
    db.flush()

    devices = [
        Device(
            customer_id=customers[0].id,
            device_type="Phone",
            brand="Apple",
            model="iPhone 14 Pro",
            serial_number="F2LZN849Q1",
            created_at=days_ago(18),
        ),
        Device(
            customer_id=customers[0].id,
            device_type="Laptop",
            brand="Apple",
            model="MacBook Air M2",
            serial_number="C02YM412J1",
            created_at=days_ago(7),
        ),
        Device(
            customer_id=customers[1].id,
            device_type="Laptop",
            brand="Dell",
            model="XPS 15 9520",
            serial_number="DXPS9520-881",
            created_at=days_ago(14),
        ),
        Device(
            customer_id=customers[2].id,
            device_type="Phone",
            brand="Samsung",
            model="Galaxy S23 Ultra",
            serial_number="R58T9120XK",
            created_at=days_ago(10),
        ),
        Device(
            customer_id=customers[3].id,
            device_type="Phone",
            brand="Google",
            model="Pixel 8",
            serial_number="GP8-441029",
            created_at=days_ago(5),
        ),
    ]
    db.add_all(devices)
    db.flush()

    repairs = [
        RepairRequest(
            ticket_code="FT-1001",
            customer_id=customers[0].id,
            device_id=devices[0].id,
            issue_description="Cracked OLED screen after drop; Face ID still functional.",
            diagnosis_notes="Replaced OEM-grade OLED assembly and transferred True Tone.",
            status="Collected",
            estimated_cost=229.0,
            final_cost=229.0,
            amount_paid=229.0,
            payment_status="Paid",
            created_at=days_ago(18),
            updated_at=days_ago(16),
            completed_at=days_ago(16),
        ),
        RepairRequest(
            ticket_code="FT-1002",
            customer_id=customers[1].id,
            device_id=devices[2].id,
            issue_description="Laptop hinge loose on right side and sticking keys.",
            diagnosis_notes="Rebuilt hinge standoffs and replaced keyboard deck.",
            status="Collected",
            estimated_cost=185.0,
            final_cost=195.0,
            amount_paid=195.0,
            payment_status="Paid",
            created_at=days_ago(14),
            updated_at=days_ago(11),
            completed_at=days_ago(11),
        ),
        RepairRequest(
            ticket_code="FT-1003",
            customer_id=customers[2].id,
            device_id=devices[3].id,
            issue_description="USB-C charging port intermittent; fast charging fails.",
            diagnosis_notes="Replaced USB-C sub-board and verified 45W charging.",
            status="Ready",
            estimated_cost=95.0,
            final_cost=95.0,
            amount_paid=45.0,
            payment_status="Partial",
            created_at=days_ago(6),
            updated_at=days_ago(1),
            completed_at=days_ago(1),
        ),
        RepairRequest(
            ticket_code="FT-1004",
            customer_id=customers[0].id,
            device_id=devices[1].id,
            issue_description="Battery service warning; shuts off around 20%.",
            diagnosis_notes="Installed replacement battery cell; calibration complete.",
            status="In Progress",
            estimated_cost=169.0,
            final_cost=169.0,
            amount_paid=0.0,
            payment_status="Unpaid",
            created_at=days_ago(4),
            updated_at=days_ago(1),
            completed_at=None,
        ),
        RepairRequest(
            ticket_code="FT-1005",
            customer_id=customers[3].id,
            device_id=devices[4].id,
            issue_description="Rear glass cracked near camera bar; microphone muffled.",
            diagnosis_notes="Initial intake logged. Awaiting bench diagnostics.",
            status="Received",
            estimated_cost=110.0,
            final_cost=110.0,
            amount_paid=0.0,
            payment_status="Unpaid",
            created_at=days_ago(1),
            updated_at=days_ago(1),
            completed_at=None,
        ),
    ]
    db.add_all(repairs)
    db.commit()
