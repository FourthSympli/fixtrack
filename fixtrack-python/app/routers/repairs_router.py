from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Customer, Device, RepairRequest, User
from app.schemas import RepairCreate, RepairOut, RepairUpdate

router = APIRouter(prefix="/api/repairs", tags=["Repairs"])


def compute_payment_status(final_cost: float, amount_paid: float) -> str:
    if amount_paid <= 0:
        return "Unpaid"
    if amount_paid + 0.001 >= final_cost and final_cost >= 0:
        return "Paid"
    return "Partial"


def serialize_repair(repair: RepairRequest) -> RepairOut:
    return RepairOut(
        id=repair.id,
        ticket_code=repair.ticket_code,
        customer_id=repair.customer_id,
        device_id=repair.device_id,
        issue_description=repair.issue_description,
        diagnosis_notes=repair.diagnosis_notes,
        status=repair.status,
        estimated_cost=round(float(repair.estimated_cost), 2),
        final_cost=round(float(repair.final_cost), 2),
        amount_paid=round(float(repair.amount_paid), 2),
        payment_status=repair.payment_status,
        created_at=repair.created_at,
        updated_at=repair.updated_at,
        completed_at=repair.completed_at,
        customer_name=repair.customer.name if repair.customer else "Unknown",
        customer_phone=repair.customer.phone if repair.customer else "",
        device_type=repair.device.device_type if repair.device else "",
        device_brand=repair.device.brand if repair.device else "",
        device_model=repair.device.model if repair.device else "",
        device_serial=repair.device.serial_number if repair.device else "",
    )


def generate_ticket_code(db: Session) -> str:
    latest = db.query(RepairRequest).order_by(RepairRequest.id.desc()).first()
    next_number = 1001 if not latest else 1001 + latest.id
    return f"FT-{next_number}"


@router.get("", response_model=List[RepairOut])
def list_repairs(
    status_filter: str = Query(default="", alias="status"),
    payment_status: str = Query(default=""),
    search: str = Query(default=""),
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    query = db.query(RepairRequest)
    if status_filter in ("Received", "In Progress", "Ready", "Collected"):
        query = query.filter(RepairRequest.status == status_filter)
    if payment_status in ("Unpaid", "Partial", "Paid"):
        query = query.filter(RepairRequest.payment_status == payment_status)

    repairs = query.order_by(RepairRequest.created_at.desc()).all()
    if search.strip():
        q = search.strip().lower()
        repairs = [
            r
            for r in repairs
            if q in r.ticket_code.lower()
            or q in r.issue_description.lower()
            or (r.customer and q in r.customer.name.lower())
            or (r.customer and q in r.customer.phone.lower())
            or (r.device and q in r.device.brand.lower())
            or (r.device and q in r.device.model.lower())
        ]
    return [serialize_repair(r) for r in repairs]


@router.post("", response_model=RepairOut, status_code=status.HTTP_201_CREATED)
def create_repair(
    payload: RepairCreate,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    customer = (
        db.query(Customer).filter(Customer.id == payload.customer_id).first()
    )
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found.")

    device = (
        db.query(Device)
        .filter(
            Device.id == payload.device_id,
            Device.customer_id == payload.customer_id,
        )
        .first()
    )
    if not device:
        raise HTTPException(
            status_code=404,
            detail="Selected device was not found for this customer.",
        )

    final_cost = (
        payload.final_cost
        if payload.final_cost is not None
        else payload.estimated_cost
    )
    payment_status = compute_payment_status(final_cost, payload.amount_paid)

    repair = RepairRequest(
        ticket_code=generate_ticket_code(db),
        customer_id=payload.customer_id,
        device_id=payload.device_id,
        issue_description=payload.issue_description.strip(),
        diagnosis_notes=payload.diagnosis_notes.strip(),
        status="Received",
        estimated_cost=round(payload.estimated_cost, 2),
        final_cost=round(final_cost, 2),
        amount_paid=round(payload.amount_paid, 2),
        payment_status=payment_status,
    )
    db.add(repair)
    db.commit()
    db.refresh(repair)
    return serialize_repair(repair)


@router.patch("/{repair_id}", response_model=RepairOut)
def update_repair(
    repair_id: int,
    payload: RepairUpdate,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    repair = db.query(RepairRequest).filter(RepairRequest.id == repair_id).first()
    if not repair:
        raise HTTPException(status_code=404, detail="Repair ticket not found.")

    if payload.status is not None:
        repair.status = payload.status
        if payload.status in ("Ready", "Collected"):
            if repair.completed_at is None:
                repair.completed_at = datetime.now(timezone.utc)
        else:
            repair.completed_at = None

    if payload.issue_description is not None:
        repair.issue_description = payload.issue_description.strip()
    if payload.diagnosis_notes is not None:
        repair.diagnosis_notes = payload.diagnosis_notes.strip()
    if payload.final_cost is not None:
        repair.final_cost = round(payload.final_cost, 2)
    if payload.amount_paid is not None:
        repair.amount_paid = round(payload.amount_paid, 2)

    repair.payment_status = compute_payment_status(
        repair.final_cost, repair.amount_paid
    )
    repair.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(repair)
    return serialize_repair(repair)


@router.delete("/{repair_id}")
def delete_repair(
    repair_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    repair = db.query(RepairRequest).filter(RepairRequest.id == repair_id).first()
    if not repair:
        raise HTTPException(status_code=404, detail="Repair ticket not found.")

    db.delete(repair)
    db.commit()
    return {"message": "Repair ticket deleted."}
