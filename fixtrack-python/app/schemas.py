from datetime import datetime
from typing import Dict, List, Literal, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field

RepairStatusType = Literal["Received", "In Progress", "Ready", "Collected"]
PaymentStatusType = Literal["Unpaid", "Partial", "Paid"]
DeviceCategoryType = Literal["Phone", "Laptop"]


class UserRegister(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: str
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class CustomerCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    phone: str = Field(..., min_length=5, max_length=40)
    email: str = Field(default="", max_length=255)
    address: str = Field(default="", max_length=255)
    notes: str = Field(default="", max_length=1000)


class CustomerUpdate(CustomerCreate):
    pass


class CustomerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    phone: str
    email: str
    address: str
    notes: str
    created_at: datetime
    device_count: int = 0
    repair_count: int = 0
    total_spent: float = 0.0


class DeviceCreate(BaseModel):
    customer_id: int
    device_type: DeviceCategoryType
    brand: str = Field(..., min_length=1, max_length=80)
    model: str = Field(..., min_length=1, max_length=120)
    serial_number: str = Field(default="", max_length=120)


class DeviceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    customer_id: int
    device_type: str
    brand: str
    model: str
    serial_number: str
    created_at: datetime
    customer_name: str = ""
    customer_phone: str = ""
    repair_count: int = 0


class RepairCreate(BaseModel):
    customer_id: int
    device_id: int
    issue_description: str = Field(..., min_length=5, max_length=2000)
    diagnosis_notes: str = Field(default="", max_length=2000)
    estimated_cost: float = Field(..., ge=0)
    final_cost: Optional[float] = Field(default=None, ge=0)
    amount_paid: float = Field(default=0.0, ge=0)


class RepairUpdate(BaseModel):
    status: Optional[RepairStatusType] = None
    issue_description: Optional[str] = Field(default=None, min_length=5, max_length=2000)
    diagnosis_notes: Optional[str] = Field(default=None, max_length=2000)
    final_cost: Optional[float] = Field(default=None, ge=0)
    amount_paid: Optional[float] = Field(default=None, ge=0)


class RepairOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    ticket_code: str
    customer_id: int
    device_id: int
    issue_description: str
    diagnosis_notes: str
    status: str
    estimated_cost: float
    final_cost: float
    amount_paid: float
    payment_status: str
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    customer_name: str = ""
    customer_phone: str = ""
    device_type: str = ""
    device_brand: str = ""
    device_model: str = ""
    device_serial: str = ""


class CustomerDetailOut(CustomerOut):
    devices: List[DeviceOut] = []
    repairs: List[RepairOut] = []


class DashboardStatsOut(BaseModel):
    total_repairs: int
    total_customers: int
    total_devices: int
    status_counts: Dict[str, int]
    total_revenue_collected: float
    total_expected_revenue: float
    outstanding_balance: float
    recent_repairs: List[RepairOut]
    unpaid_repairs: List[RepairOut]
