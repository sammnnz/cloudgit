FROM postgres:16-alpine3.22

RUN apk update
RUN apk add bash
RUN apk add gettext # for envsubst

SHELL ["/bin/bash", "-c"]

ARG PGDATA
ARG POSTGRES_DB
ARG POSTGRES_USER
ARG POSTGRES_PASSWORD

ENV PGDATA=$PGDATA
ENV POSTGRES_DB=$POSTGRES_DB
ENV POSTGRES_USER=$POSTGRES_USER
ENV POSTGRES_PASSWORD=$POSTGRES_PASSWORD

WORKDIR /docker-entrypoint-initdb.d

COPY init.sql ./init.sql

RUN echo "`envsubst < ./init.sql`" > ./init.sql
RUN chmod +x ./init.sql
RUN chown -R postgres:postgres ./init.sql

WORKDIR /

RUN chown -R postgres:postgres $PGDATA
#RUN chmod u+s /bin/su
