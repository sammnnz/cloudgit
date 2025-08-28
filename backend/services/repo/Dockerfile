FROM python:3.10-alpine

RUN apk update
RUN apk add bash
RUN apk add curl

SHELL ["/bin/bash", "-c"]

RUN pip install --upgrade pip setuptools wheel
RUN pip install pip-tools==7.4.1

ENV PATH="/root/.local/bin:$PATH"
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

ARG ROOT_FOLDER=/app/cloudgit
ARG SERVICE_FOLDER=${ROOT_FOLDER}/services/repo
ARG USERNAME

RUN addgroup -g 1001 ${USERNAME} && \
    adduser -G ${USERNAME} -S -u 1001 ${USERNAME}
RUN mkdir -m 750 -p ${ROOT_FOLDER}/common && \
    chown ${USERNAME}:${USERNAME} ${ROOT_FOLDER}/common
RUN mkdir -m 750 -p ${SERVICE_FOLDER} && \
    chown ${USERNAME}:${USERNAME} ${SERVICE_FOLDER}
RUN mkdir -m 750 -p ${SERVICE_FOLDER}/logs && \
    chown ${USERNAME}:${USERNAME} ${SERVICE_FOLDER}/logs

ENV LOG_DIR=${SERVICE_FOLDER}/logs

WORKDIR ${ROOT_FOLDER}/common

COPY --from=common --chown=${USERNAME}:${USERNAME} . ./

WORKDIR ${SERVICE_FOLDER}

COPY --chown=${USERNAME}:${USERNAME} pyproject.toml README.md ./

RUN pip-compile --extra common --extra postgres --output-file requirements.txt pyproject.toml
RUN pip install -r requirements.txt

COPY --chown=${USERNAME}:${USERNAME} . ./

RUN chmod +x ./manage.py

ENV PYTHONPATH=${SERVICE_FOLDER}

USER 1001

CMD [ "python", "run.py" ]
