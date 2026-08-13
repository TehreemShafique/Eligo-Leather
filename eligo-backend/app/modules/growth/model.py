import enum
from datetime import datetime

from sqlalchemy import (
    String, Integer, Float, Numeric, Text, DateTime,
    Index, Enum as SAEnum, func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class AttributionChannel(str, enum.Enum):
    google_search = "Google Search"
    direct = "Direct"
    bing = "Bing"
    chatgpt = "chatgpt.com"
    instagram = "Instagram"
    yahoo = "Yahoo!"
    facebook = "Facebook"
    duckduckgo = "DuckDuckGo"


class TrafficType(str, enum.Enum):
    organic = "Organic"
    direct = "Direct"
    unknown = "Unknown"


class CampaignStatus(str, enum.Enum):
    active = "Active"
    draft = "Draft"
    completed = "Completed"
    paused = "Paused"


class Attribution(Base):
    __tablename__ = "attribution"
    __table_args__ = (
        Index("ix_attribution_channel", "channel"),
        Index("ix_attribution_type", "type"),
        Index("ix_attribution_created_at", "created_at"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    channel: Mapped[str] = mapped_column(String, nullable=False)
    type: Mapped[str] = mapped_column(String, nullable=False)
    sessions: Mapped[int] = mapped_column(Integer, default=0)
    sales: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    orders: Mapped[int] = mapped_column(Integer, default=0)
    conversion_rate: Mapped[float] = mapped_column(Float, default=0.0)
    cost: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    roas: Mapped[float] = mapped_column(Numeric(10, 4), default=0)
    cpa: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    ctr: Mapped[float] = mapped_column(Float, default=0.0)
    aov: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    orders_from_new_customers: Mapped[int] = mapped_column(Integer, default=0)
    orders_from_returning_customers: Mapped[int] = mapped_column(Integer, default=0)
    referring_category: Mapped[str | None] = mapped_column(String, nullable=True)
    referring_url: Mapped[str | None] = mapped_column(String, nullable=True)
    impressions: Mapped[int] = mapped_column(Integer, default=0)
    clicks: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
    )


class Campaign(Base):
    __tablename__ = "campaigns"
    __table_args__ = (
        Index("ix_campaigns_status", "status"),
        Index("ix_campaigns_created_at", "created_at"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    campaign_name: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(
        SAEnum(CampaignStatus, name="campaign_status"),
        default=CampaignStatus.draft,
    )
    unassigned_activities_count: Mapped[int] = mapped_column(Integer, default=0)
    target_metrics: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
    )
