FROM python:3.10-alpine

RUN apk update
RUN apk add bash

SHELL ["/bin/bash", "-c"]

RUN pip install --upgrade pip setuptools wheel
RUN pip install pip-tools

#RUN pip install --upgrade pip
#RUN pip install poetry

ENV PATH="/root/.local/bin:$PATH"
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

ARG ROOT_FOLDER=/app/cloudgit
ARG SERVICE_FOLDER=${ROOT_FOLDER}/services/repo

RUN addgroup -g 1001 appuser && \
    adduser -G appuser -S -u 1001 appuser && \
    mkdir -m 750 -p ${ROOT_FOLDER}/common && \
    chown appuser:appuser ${ROOT_FOLDER}/common && \
    mkdir -m 750 -p ${SERVICE_FOLDER} && \
    chown appuser:appuser ${SERVICE_FOLDER} && \
    mkdir -m 750 -p ${SERVICE_FOLDER}/logs && \
    chown appuser:appuser ${SERVICE_FOLDER}/logs

ENV LOG_DIR=${SERVICE_FOLDER}/logs

WORKDIR ${ROOT_FOLDER}/common

COPY --from=common --chown=appuser:appuser . ./

WORKDIR ${SERVICE_FOLDER}

COPY --chown=appuser:appuser pyproject.toml README.md ./

RUN pip-compile --extra common --extra postgres --output-file requirements.txt pyproject.toml
RUN pip install -r requirements.txt

# Poetry variant more big
#COPY --chown=appuser:appuser pyproject.toml poetry.lock ./
#
#RUN poetry config virtualenvs.create false
#RUN poetry lock && poetry install --no-interaction --no-root --extras "postgres common"
#RUN pip uninstall poetry -y

COPY --chown=appuser:appuser . ./

RUN chmod +x ./manage.py

ENV PYTHONPATH=${SERVICE_FOLDER}

USER 1001

CMD [ "python", "run.py" ]
