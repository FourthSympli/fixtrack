from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Customer, Device, RepairRequest, User
from app.routers.repairs_router import serialize_repair
from app.schemas import DashboardStatsOut

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStatsOut)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    repairs = (
        db.query(RepairRequest).order_by(RepairRequest.created_at.desc()).all()
    )
    status_counts = {
        "Received": 0,
        "In Progress": 0,
        "Ready": 0,
        "Collected": 0,
    }
    total_collected = 0.0
    total_expected = 0.0

    for repair in repairs:
        if repair.status in status_counts:
            status_counts[repair.status] += 1
        total_collected += float(repair.amount_paid or 0)
        total_expected += float(repair.final_cost or 0)

    serialized = [serialize_repair(r) for r in repairs]
    unpaid = [r for r in serialized if r.payment_status != "Paid"]

    return DashboardStatsOut(
        total_repairs=len(repairs),
        total_customers=db.query(Customer).count(),
        total_devices=db.query(Device).count(),
        status_counts=status_counts,
        total_revenue_collected=round(total_collected, 2),
        total_expected_revenue=round(total_expected, 2),
        outstanding_balance=round(max(0.0, total_expected - total_collected), 2),
        recent_repairs=serialized[:6],
        unpaid_repairs=unpaid[:5],
    )
