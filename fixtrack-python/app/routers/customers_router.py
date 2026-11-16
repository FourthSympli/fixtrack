from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Customer, RepairRequest, User
from app.routers.repairs_router import serialize_repair
from app.schemas import (
    CustomerCreate,
    CustomerDetailOut,
    CustomerOut,
    CustomerUpdate,
    DeviceOut,
)

router = APIRouter(prefix="/api/customers", tags=["Customers"])


def serialize_customer(customer: Customer) -> CustomerOut:
    total_spent = sum(float(r.amount_paid or 0) for r in customer.repairs)
    return CustomerOut(
        id=customer.id,
        name=customer.name,
        phone=customer.phone,
        email=customer.email,
        address=customer.address,
        notes=customer.notes,
        created_at=customer.created_at,
        device_count=len(customer.devices),
        repair_count=len(customer.repairs),
        total_spent=round(total_spent, 2),
    )


@router.get("", response_model=List[CustomerOut])
def list_customers(
    search: str = Query(default="", max_length=120),
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    query = db.query(Customer)
    if search.strip():
        pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Customer.name.ilike(pattern),
                Customer.phone.ilike(pattern),
                Customer.email.ilike(pattern),
            )
        )
    customers = query.order_by(Customer.created_at.desc()).all()
    return [serialize_customer(c) for c in customers]


@router.post("", response_model=CustomerOut, status_code=status.HTTP_201_CREATED)
def create_customer(
    payload: CustomerCreate,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    customer = Customer(
        name=payload.name.strip(),
        phone=payload.phone.strip(),
        email=payload.email.strip(),
        address=payload.address.strip(),
        notes=payload.notes.strip(),
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return serialize_customer(customer)


@router.get("/{customer_id}", response_model=CustomerDetailOut)
def get_customer_detail(
    customer_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found.")

    devices_out = [
        DeviceOut(
            id=d.id,
            customer_id=d.customer_id,
            device_type=d.device_type,
            brand=d.brand,
            model=d.model,
            serial_number=d.serial_number,
            created_at=d.created_at,
            customer_name=customer.name,
            customer_phone=customer.phone,
            repair_count=len(d.repairs),
        )
        for d in customer.devices
    ]

    repairs_sorted = sorted(
        customer.repairs, key=lambda r: r.created_at, reverse=True
    )
    repairs_out = [serialize_repair(r) for r in repairs_sorted]
    base = serialize_customer(customer)

    return CustomerDetailOut(
        **base.model_dump(),
        devices=devices_out,
        repairs=repairs_out,
    )


@router.put("/{customer_id}", response_model=CustomerOut)
def update_customer(
    customer_id: int,
    payload: CustomerUpdate,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found.")

    customer.name = payload.name.strip()
    customer.phone = payload.phone.strip()
    customer.email = payload.email.strip()
    customer.address = payload.address.strip()
    customer.notes = payload.notes.strip()
    db.commit()
    db.refresh(customer)
    return serialize_customer(customer)


@router.delete("/{customer_id}")
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found.")

    db.delete(customer)
    db.commit()
    return {"message": "Customer deleted."}
