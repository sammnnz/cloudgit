FROM alpine:3.22

ARG COMMON_FOLDER=/app/common

RUN mkdir -m 750 -p ${COMMON_FOLDER}

WORKDIR $COMMON_FOLDER

COPY . .

RUN chmod -R 750 .
