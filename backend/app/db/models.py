from sqlalchemy import Column, Integer, String, DateTime, Float, JSON, ForeignKey, Boolean
from datetime import datetime
from app.db.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    is_org_admin = Column(Boolean, default=False)
    email_verified = Column(Boolean, default=False)
    email_verified_at = Column(DateTime, nullable=True)
    last_login_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, index=True)
    name = Column(String, index=True)
    file_path = Column(String)
    format = Column(String)
    n_rows = Column(Integer, default=0)
    n_columns = Column(Integer, default=0)
    size_bytes = Column(Integer, default=0)
    data_type = Column(String, default="unknown")
    uploaded_at = Column(String, default=lambda: datetime.utcnow().isoformat())

class Experiment(Base):
    __tablename__ = "experiments"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id"))
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    status = Column(String, default="created")
    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    config = Column(JSON, nullable=True)
    best_metrics = Column(JSON, nullable=True)
    results = Column(JSON, nullable=True)

class MetricLog(Base):
    __tablename__ = "metric_logs"

    id = Column(Integer, primary_key=True, index=True)
    experiment_id = Column(Integer, ForeignKey("experiments.id"))
    step = Column(Integer, default=1)
    metrics = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

class ModelRun(Base):
    __tablename__ = "model_runs"

    id = Column(Integer, primary_key=True, index=True)
    experiment_id = Column(Integer, ForeignKey("experiments.id"))
    model_name = Column(String, index=True)
    hyperparameters = Column(JSON, nullable=True)
    metrics = Column(JSON, nullable=True)
    training_time_seconds = Column(Float, nullable=True)
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)



