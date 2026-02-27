from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import engine, Base

from .routers import auth, voters, voting, elections

# Create tables in sqlite if they don't exist
# In a real setup, alembic should be used.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Blockchain-Based Voting System API",
    description="API for managing elections, voter registrations, biometrics, and blockchain voting",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Welcome to the Blockchain-Based Voting System API - Active"}

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(voters.router, prefix="/api/voters", tags=["Voters"])
app.include_router(voting.router, prefix="/api/voting", tags=["Voting"])
app.include_router(elections.router_elections, prefix="/api/elections", tags=["Elections"])
app.include_router(elections.router_candidates, prefix="/api/candidates", tags=["Candidates"])

# Create default admin if DB is fresh
@app.on_event("startup")
def create_default_admin():
    from sqlalchemy.orm import Session
    from .database import SessionLocal
    from .models.admin import Admin, AdminRole
    from .middleware.auth import get_password_hash
    
    db: Session = SessionLocal()
    if not db.query(Admin).first():
        print("Creating default superadmin: username='superadmin', password='Admin@123456'")
        admin = Admin(
            username="superadmin",
            email="admin@blockvote.local",
            password_hash=get_password_hash("Admin@123456"),
            role=AdminRole.super_admin
        )
        db.add(admin)
        db.commit()
    db.close()
