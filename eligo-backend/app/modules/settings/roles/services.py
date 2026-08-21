from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.settings.roles.model import Roles
from app.modules.settings.roles.schema import RoleCreate
from app.modules.auth.model import User

SYSTEM_ROLES = [
    ("App developer", "organization"),
    ("Cashier", "point_of_sale"),
    ("Customer support", "store"),
    ("Marketer", "store"),
    ("Merchandiser", "store"),
    ("Online store editor", "store"),
    ("Administrator", "organization"),
    ("POS administrator", "organization"),
    ("POS full permissions", "point_of_sale"),
    ("POS device setup", "point_of_sale"),
    ("POS user administrator", "point_of_sale"),
    ("Sales associate", "point_of_sale"),
    ("Store manager", "point_of_sale"),
    ("Store owner", "organization"),  # top-level, assigned to the first admin
]

async def seed_system_roles(db:AsyncSession) -> None:
    role = await db.execute(select(Roles.name))
    existing_names = {row[0] for row in role.all()} # store in set, so no duplicate occur in roles storage

    for name, domain in SYSTEM_ROLES:
        if name not in existing_names:
            db.add(Roles(name = name, domain = domain, is_system = True))

    await db.commit()

async def list_roles(db: AsyncSession) -> list[dict]:
    result = await db.execute(select(Roles))
    roles = list(result.scalars().all())

    output = []

    for role in roles:
        count_result = await db.execute(select(func.count()).select_from(User).where(User.role_id == role.id))
        count = count_result.scalar_one()
        output.append(
            {"id": role.id, "name": role.name, "domain": role.domain, "description": role.description,
            "is_system": role.is_system, "user_count": count,}
        )

    return output
async def get_role(db: AsyncSession, role_id: int) -> Roles | None:
    return await db.get(Roles, role_id)

async def create_role(db:AsyncSession, data: RoleCreate) -> Roles:
    role = Roles(**data.model_dump(), is_system=False)
    db.add(role)
    await db.commit()
    await db.refresh(role)
    return role
