#!/usr/bin/env bash
docker build -t cloudgit-auth --build-context common=./backend/common  backend/services/auth
docker build -t cloudgit-repo --build-context common=./backend/common  backend/services/repo
docker compose -f docker-compose.yml up nginx -d
