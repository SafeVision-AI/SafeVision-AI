from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import JSON, DateTime, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from core.database import Base


class UserProfile(Base):
    __tablename__ = 'user_profiles'

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    blood_group: Mapped[str | None] = mapped_column(String(10), nullable=True)
    emergency_contacts: Mapped[list | None] = mapped_column(JSON, nullable=True)  # List of dicts: [{'name': '...', 'phone': '...', 'relation': '...'}]
    allergies: Mapped[str | None] = mapped_column(Text, nullable=True)
    vehicle_details: Mapped[str | None] = mapped_column(Text, nullable=True)
    medical_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
