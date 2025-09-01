FROM python:3.10-alpine

RUN apk update
RUN apk add bash

SHELL ["/bin/bash", "-c"]

RUN pip install --upgrade pip setuptools wheel
RUN pip install pip-tools==7.4.1

ENV PATH="/root/.local/bin:$PATH"
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

ARG USERNAME
ARG ROOT_FOLDER=/app/cloudgit
ARG SERVICE_FOLDER=${ROOT_FOLDER}/services/sshproxy
ARG SSH_AUTHORIZED_KEYS=/home/${USERNAME}/.ssh/authorized_keys

RUN addgroup -g 1001 ${USERNAME} && \
    adduser -G ${USERNAME} -S -u 1001 ${USERNAME}
RUN mkdir -m 750 -p ${ROOT_FOLDER}/common && \
    chown ${USERNAME}:${USERNAME} ${ROOT_FOLDER}/common
RUN mkdir -m 750 -p ${SERVICE_FOLDER} && \
    chown ${USERNAME}:${USERNAME} ${SERVICE_FOLDER}
RUN mkdir -m 750 -p ${SSH_AUTHORIZED_KEYS} && \
    chown ${USERNAME}:${USERNAME} ${SSH_AUTHORIZED_KEYS}
RUN mkdir -m 750 -p ${SERVICE_FOLDER}/logs && \
    chown ${USERNAME}:${USERNAME} ${SERVICE_FOLDER}/logs

ENV LOG_DIR=${SERVICE_FOLDER}/logs

WORKDIR ${ROOT_FOLDER}/common

COPY --from=common --chown=${USERNAME}:${USERNAME} . ./

WORKDIR ${SERVICE_FOLDER}

COPY --chown=${USERNAME}:${USERNAME} pyproject.toml README.md ./

RUN pip-compile --extra common --output-file requirements.txt pyproject.toml
RUN pip install -r requirements.txt

COPY --chown=${USERNAME}:${USERNAME} . ./

ENV PYTHONPATH=${SERVICE_FOLDER}

USER 1001

CMD [ "python", "server/run.py" ]
