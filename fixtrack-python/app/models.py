from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False, index=True)
    phone = Column(String(40), nullable=False, index=True)
    email = Column(String(255), default="", nullable=False)
    address = Column(String(255), default="", nullable=False)
    notes = Column(Text, default="", nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    devices = relationship(
        "Device", back_populates="customer", cascade="all, delete-orphan"
    )
    repairs = relationship(
        "RepairRequest", back_populates="customer", cascade="all, delete-orphan"
    )


class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(
        Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False
    )
    device_type = Column(String(20), nullable=False)  # Phone | Laptop
    brand = Column(String(80), nullable=False)
    model = Column(String(120), nullable=False)
    serial_number = Column(String(120), default="", nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    customer = relationship("Customer", back_populates="devices")
    repairs = relationship(
        "RepairRequest", back_populates="device", cascade="all, delete-orphan"
    )


class RepairRequest(Base):
    __tablename__ = "repair_requests"

    id = Column(Integer, primary_key=True, index=True)
    ticket_code = Column(String(20), unique=True, index=True, nullable=False)
    customer_id = Column(
        Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False
    )
    device_id = Column(
        Integer, ForeignKey("devices.id", ondelete="CASCADE"), nullable=False
    )
    issue_description = Column(Text, nullable=False)
    diagnosis_notes = Column(Text, default="", nullable=False)
    status = Column(
        String(30), default="Received", nullable=False, index=True
    )  # Received | In Progress | Ready | Collected
    estimated_cost = Column(Float, default=0.0, nullable=False)
    final_cost = Column(Float, default=0.0, nullable=False)
    amount_paid = Column(Float, default=0.0, nullable=False)
    payment_status = Column(
        String(20), default="Unpaid", nullable=False
    )  # Unpaid | Partial | Paid
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )
    completed_at = Column(DateTime(timezone=True), nullable=True)

    customer = relationship("Customer", back_populates="repairs")
    device = relationship("Device", back_populates="repairs")
