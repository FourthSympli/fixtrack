from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Customer, Device, User
from app.schemas import DeviceCreate, DeviceOut

router = APIRouter(prefix="/api/devices", tags=["Devices"])


def serialize_device(device: Device) -> DeviceOut:
    return DeviceOut(
        id=device.id,
        customer_id=device.customer_id,
        device_type=device.device_type,
        brand=device.brand,
        model=device.model,
        serial_number=device.serial_number,
        created_at=device.created_at,
        customer_name=device.customer.name if device.customer else "Unknown",
        customer_phone=device.customer.phone if device.customer else "",
        repair_count=len(device.repairs),
    )


@router.get("", response_model=List[DeviceOut])
def list_devices(
    customer_id: Optional[int] = Query(default=None),
    device_type: str = Query(default="", max_length=20),
    search: str = Query(default="", max_length=120),
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    query = db.query(Device)
    if customer_id is not None:
        query = query.filter(Device.customer_id == customer_id)
    if device_type in ("Phone", "Laptop"):
        query = query.filter(Device.device_type == device_type)

    devices = query.order_by(Device.created_at.desc()).all()
    if search.strip():
        q = search.strip().lower()
        devices = [
            d
            for d in devices
            if q in d.brand.lower()
            or q in d.model.lower()
            or q in d.serial_number.lower()
            or (d.customer and q in d.customer.name.lower())
        ]
    return [serialize_device(d) for d in devices]


@router.post("", response_model=DeviceOut, status_code=status.HTTP_201_CREATED)
def create_device(
    payload: DeviceCreate,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    customer = (
        db.query(Customer).filter(Customer.id == payload.customer_id).first()
    )
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found.")

    device = Device(
        customer_id=payload.customer_id,
        device_type=payload.device_type,
        brand=payload.brand.strip(),
        model=payload.model.strip(),
        serial_number=payload.serial_number.strip(),
    )
    db.add(device)
    db.commit()
    db.refresh(device)
    return serialize_device(device)


@router.delete("/{device_id}")
def delete_device(
    device_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found.")

    db.delete(device)
    db.commit()
    return {"message": "Device deleted."}
