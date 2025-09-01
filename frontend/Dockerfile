FROM node:20-alpine AS build

WORKDIR /frontend

COPY package.json package-lock.json ./

RUN npm install --frozen-lockfile

COPY . .

ARG VITE_DEBUG
ARG VITE_REMOTE_SERVER_URL

ENV VITE_DEBUG=$VITE_DEBUG
ENV VITE_REMOTE_SERVER_URL=$VITE_REMOTE_SERVER_URL

RUN npm run build

FROM nginx:1.29.0-alpine-slim

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /frontend/build /usr/share/nginx/html

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
