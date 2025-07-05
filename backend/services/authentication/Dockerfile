FROM python:3.10-alpine

RUN apk update
RUN apk add bash

SHELL ["/bin/bash", "-c"]

RUN pip install --upgrade pip
RUN pip install poetry

ENV PATH="/root/.local/bin:$PATH"
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

ARG APPS_FOLDER=/srv/www/cloudgit/services
ARG APP_FOLDER=${APPS_FOLDER}/authentication

RUN addgroup -g 1001 appuser && \
    adduser -G appuser -S -u 1001 appuser && \
    mkdir -m 750 -p ${APP_FOLDER} && \
    chown appuser:appuser ${APP_FOLDER} && \
    mkdir -m 750 -p ${APP_FOLDER}/logs && \
    chown -R appuser:appuser ${APP_FOLDER}/logs

ENV LOG_DIR=${APP_FOLDER}/logs

WORKDIR ${APP_FOLDER}

COPY --chown=appuser:appuser pyproject.toml poetry.lock ./

RUN poetry config virtualenvs.create false
RUN poetry lock
RUN poetry install --no-interaction --no-root --extras postgres

COPY --chown=appuser:appuser . ./

RUN chmod +x ./manage.py

ENV PYTHONPATH=${APPS_FOLDER}

USER 1001

CMD [ "gunicorn", "-c", "gunicorn.conf.py", "wsgi:application" ]
