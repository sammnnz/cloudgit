#!/usr/bin/env bash
docker build -t cloudgit-auth --build-context common=./backend/common  backend/services/auth
docker compose -f docker-compose.yml up nginx -d
