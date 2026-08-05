from sqlalchemy import Enum as SAEnum
import enum
from app.db.base import Base
from sqlalchemy import String, Boolean, Integer, func, DateTime, Date
from sqlalchemy.orm import  Mapped, mapped_column
from datetime import datetime, date

class BusinessType(str, enum.Enum):
    individual = "individual"
    company = "company"
    non_profit = "non-profit"

class FulfillmentPolicy(str, enum.Enum):
    auto_fulfill_all = "auto_fulfill_all"
    auto_fulfill_giftCard_only = "auto_fulfill_giftCard_only"
    manual =  "manual"

class StoreSettings(Base):
# singleton table: always has one row(only company's details)
    __tablename__ = "store_settings"

    id : Mapped[int] = mapped_column(primary_key=True)
    store_name: Mapped[str] = mapped_column(String, default= "Eligo Leather")
    support_email: Mapped[str | None] = mapped_column(String, nullable= True)
    store_phone: Mapped[str | None] = mapped_column(String, nullable= True)

    comapny_name: Mapped[str | None] = mapped_column(String, nullable= True)
    address:Mapped[str | None] = mapped_column(String, nullable= True) 
    country:Mapped[str] = mapped_column(String, default= "Pakistan")
    appartment:Mapped[str | None] = mapped_column(String, nullable= True)
    city:Mapped[str | None] = mapped_column(String, nullable= True)
    postal_code:Mapped[str | None] = mapped_column(String, nullable= True)

    currency : Mapped[str] = mapped_column(String, default="PKR")
    backup_region : Mapped[str] = mapped_column(String, default="Pakistan")
    default_weight_unit : Mapped[str] = mapped_column(String, default="kg")
    timezone : Mapped[str] = mapped_column(String, default="Asia/Pakistan/Islamabad")
    unit_system: Mapped[str] = mapped_column(String, default="metrics")

    order_id_prefix: Mapped[str] = mapped_column(String, default="#")
    order_id_sufix: Mapped[str | None] = mapped_column(String, nullable=True)

    fulfillment_policy: Mapped[FulfillmentPolicy] = mapped_column(SAEnum(FulfillmentPolicy), default=FulfillmentPolicy.manual)

    auto_archive_on_fulfillment: Mapped[bool] = mapped_column(Boolean, default=False)
    update_at : Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate= func.now())


class BusinessEntity(Base):
    __tablename__ = "business_entity"

    id : Mapped[int] = mapped_column(primary_key=True)

    business_type: Mapped[BusinessType] = mapped_column(SAEnum(BusinessType), default=BusinessType.individual)
    nickname: Mapped[str | None] = mapped_column(String, nullable=True)
    first_name: Mapped[str | None] = mapped_column(String, nullable=True)
    last_name: Mapped[str | None] = mapped_column(String, nullable=True)
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)

    country: Mapped[str] = mapped_column(String, default="Pakistan")
    residential_address: Mapped[str | None] = mapped_column(String, nullable= True)
    appartment: Mapped[str | None] = mapped_column(String, nullable= True)
    city: Mapped[str | None] = mapped_column(String, nullable= True)
    postal_code: Mapped[str | None] = mapped_column(String, nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_archive: Mapped[bool] = mapped_column(Boolean, default=False)

    update_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate= func.now())
    create_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class StoreBrand(Base):
    # also a singleton table: has only one row
    __tablename__ = "store_brand"

    id: Mapped[int] = mapped_column(primary_key=True)

    logo_url: Mapped[str | None] = mapped_column(String, nullable= True)
    square_logo_url: Mapped[str | None] = mapped_column(String, nullable= True)
    primary_color: Mapped[str | None] = mapped_column(String, nullable= True)
    secondary_color: Mapped[str | None] = mapped_column(String, nullable= True)

    cover_image_url: Mapped[str | None] = mapped_column(String, nullable= True)
    slogan: Mapped[str | None] = mapped_column(String, nullable= True)
    short_description: Mapped[str | None] = mapped_column(String, nullable= True)
    social_links: Mapped[str | None] = mapped_column(String, nullable= True) # jsom format{inta: "link of insta", fb: "link of fb", ...}

    update_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    

