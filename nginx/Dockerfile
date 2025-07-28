FROM nginx:1.29.0-alpine-slim

RUN apk update
RUN apk add bash
RUN apk add gettext # for envsubst

SHELL ["/bin/bash", "-c"]

ARG AUTH_PORT
ARG FRONTEND_PORT
ARG RABBITMQ_NODE_PORT
ARG NGINX_FOLDER=/etc/nginx

WORKDIR ${NGINX_FOLDER}

ENV AUTH_PORT=$AUTH_PORT
ENV FRONTEND_PORT=$FRONTEND_PORT
ENV RABBITMQ_NODE_PORT=$RABBITMQ_NODE_PORT

RUN addgroup -g 1001 nginx_admin && \
    adduser -G nginx_admin -S -u 1001 nginx_admin && \
    mkdir -m 750 -p ${NGINX_FOLDER} && \
    chown -R nginx_admin:nginx_admin ${NGINX_FOLDER} && chmod -R 750 ${NGINX_FOLDER} && \
    cd /var/cache/nginx && mkdir -p client_temp proxy_temp fastcgi_temp uwsgi_temp scgi_temp && \
    chown -R nginx_admin:nginx_admin /var/cache/nginx && chmod -R 750 /var/cache/nginx && \
    chown -R nginx_admin:nginx_admin /run && chmod -R 777 /run

COPY --chown=nginx_admin:nginx_admin proxy_params ./proxy_params
COPY nginx.conf ./nginx.conf

# https://www.baeldung.com/linux/nginx-config-environment-variables
RUN echo "`envsubst < ./nginx.conf`" > ./nginx.conf
RUN chown nginx_admin:nginx_admin ./nginx.conf

USER 1001
