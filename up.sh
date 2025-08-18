#!/usr/bin/env bash
docker build -t cloudgit-auth --build-context common=./backend/common  backend/services/auth
docker build -t cloudgit-repo --build-context common=./backend/common  backend/services/repo
source .env
CLOUDGIT_EMAIL=$CLOUDGIT_EMAIL CLOUDGIT_STORAGE_NAME=$STORAGE_1_NAME ./storages/run.sh
CLOUDGIT_EMAIL=$CLOUDGIT_EMAIL CLOUDGIT_STORAGE_NAME=$STORAGE_2_NAME ./storages/run.sh
docker compose -f docker-compose.yml up nginx -d
