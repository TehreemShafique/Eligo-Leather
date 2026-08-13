from pydantic import BaseModel, ConfigDict, field_validator
from app.modules.settings.general.model import FulfillmentPolicy, BusinessType
from datetime import datetime, date

class StoreSettingsUpdate(BaseModel):
    store_name: str | None = None
    support_email: str | None = None
    store_phone: str | None = None
    comapny_name: str | None = None
    address: str | None = None
    country: str | None = None
    appartment: str | None = None
    city: str | None = None
    postal_code: str | None = None
    currency : str | None = None
    backup_region : str | None = None
    default_weight_unit : str | None = None
    timezone : str | None = None
    unit_system: str | None = None
    order_id_prefix: str | None = None
    order_id_sufix: str | None = None
    fulfillment_policy: str | None = None
    auto_archive_on_fulfillment: FulfillmentPolicy | None = None

class StoreSettingOut(BaseModel):
    id: int
    store_name: str 
    support_email: str | None = None
    store_phone: str | None = None
    comapny_name: str | None = None
    address: str | None = None
    country: str 
    appartment: str | None = None
    city: str | None = None
    postal_code: str | None = None
    currency : str 
    backup_region : str 
    default_weight_unit : str 
    timezone : str
    unit_system: str 
    order_id_prefix: str 
    order_id_sufix: str | None = None
    fulfillment_policy: str | None = None
    auto_archive_on_fulfillment: FulfillmentPolicy 
    update_at: datetime

    model_config = ConfigDict(from_attributes= True)

class BusinessEntityCreate(BaseModel):
    business_type: BusinessType | None = None
    nickname: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    date_of_birth: date | None = None
    country: str | None = None
    residential_address: str | None = None
    appartment: str | None = None
    city: str | None = None
    postal_code: str | None = None

    @field_validator("date_of_birth", mode="before")
    @classmethod
    def parse_date(cls, v):
        if isinstance(v, str):
            parts = v.split("-")
            if len(parts) == 3 and len(parts[0]) == 2 and len(parts[2]) == 4:
                from datetime import date as dt_date
                return dt_date(int(parts[2]), int(parts[1]), int(parts[0]))
        return v

class BusinessEntityUpdate(BaseModel):
    business_type: BusinessType | None = None
    nickname: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    date_of_birth: date | None = None
    country: str | None = None
    residential_address: str | None = None
    appartment: str | None = None
    city: str | None = None
    postal_code: str | None = None
    is_active: bool | None = None
class BusinessEntityOut(BaseModel):
    id: int
    business_type: BusinessType  
    nickname: str | None 
    first_name: str | None 
    last_name: str | None 
    date_of_birth: date | None 
    country: str
    residential_address: str | None
    appartment: str | None
    city: str | None 
    postal_code: str | None 
    is_active: bool | None 
    is_archive: bool | None
    update_at: datetime

    model_config = ConfigDict(from_attributes= True)

class StoreBrandUpdate(BaseModel):
    logo_url: str | None = None
    square_logo_url: str | None = None
    primary_color: str | None = None
    secondary_color: str | None = None
    cover_image_url: str | None = None
    slogan: str | None = None
    short_description: str | None = None
    social_links: str | None = None

class StoreBrandOut(BaseModel):
    id: int
    logo_url: str | None 
    square_logo_url: str | None
    primary_color: str | None 
    secondary_color: str | None 
    cover_image_url: str | None
    slogan: str | None
    short_description: str | None
    social_links: str | None
    update_at: datetime

    model_config = ConfigDict(from_attributes=True)



    