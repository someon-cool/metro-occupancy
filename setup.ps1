$ErrorActionPreference = "Stop"

Write-Host "Creating Metro Occupancy project structure..." -ForegroundColor Cyan

# ============================================================
# ROOT
# ============================================================

New-Item -ItemType File -Force README.md
New-Item -ItemType File -Force docker-compose.yml
New-Item -ItemType File -Force .env.example
New-Item -ItemType File -Force .gitignore

# ============================================================
# GITHUB
# ============================================================

New-Item -ItemType Directory -Force .github/workflows

New-Item -ItemType File -Force .github/workflows/ci.yml
New-Item -ItemType File -Force .github/pull_request_template.md

# ============================================================
# DOCS
# ============================================================

New-Item -ItemType Directory -Force docs/diagrams

New-Item -ItemType File -Force docs/architecture.md
New-Item -ItemType File -Force docs/api-contract.md

# ============================================================
# EDGE - PERSON A
# ============================================================

New-Item -ItemType Directory -Force edge/src
New-Item -ItemType Directory -Force edge/models
New-Item -ItemType Directory -Force edge/experiments
New-Item -ItemType Directory -Force edge/tests

New-Item -ItemType File -Force edge/requirements.txt
New-Item -ItemType File -Force edge/Dockerfile

New-Item -ItemType File -Force edge/src/main.py
New-Item -ItemType File -Force edge/src/config.py
New-Item -ItemType File -Force edge/src/detector.py
New-Item -ItemType File -Force edge/src/tracker.py
New-Item -ItemType File -Force edge/src/counter.py
New-Item -ItemType File -Force edge/src/publisher.py

# ============================================================
# BACKEND - PERSON B
# ============================================================

New-Item -ItemType Directory -Force backend/alembic
New-Item -ItemType Directory -Force backend/app/api
New-Item -ItemType Directory -Force backend/app/core
New-Item -ItemType Directory -Force backend/app/db
New-Item -ItemType Directory -Force backend/app/mqtt
New-Item -ItemType Directory -Force backend/app/services
New-Item -ItemType Directory -Force backend/app/schemas
New-Item -ItemType Directory -Force backend/tests

New-Item -ItemType File -Force backend/Dockerfile
New-Item -ItemType File -Force backend/requirements.txt

# ============================================================
# ML - PERSON C
# ============================================================

New-Item -ItemType Directory -Force ml/simulator
New-Item -ItemType Directory -Force ml/notebooks
New-Item -ItemType Directory -Force ml/training
New-Item -ItemType Directory -Force ml/prediction_service
New-Item -ItemType Directory -Force ml/recommendation
New-Item -ItemType Directory -Force ml/artifacts

# ============================================================
# FRONTEND - PERSON D
# ============================================================

New-Item -ItemType Directory -Force frontend/src/components
New-Item -ItemType Directory -Force frontend/src/pages
New-Item -ItemType Directory -Force frontend/src/hooks
New-Item -ItemType Directory -Force frontend/src/api

New-Item -ItemType File -Force frontend/Dockerfile

# ============================================================
# INFRASTRUCTURE
# ============================================================

New-Item -ItemType Directory -Force infra/mosquitto

New-Item -ItemType File -Force infra/mosquitto/mosquitto.conf

# ============================================================
# SCRIPTS
# ============================================================

New-Item -ItemType Directory -Force scripts

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "Project structure created successfully!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
