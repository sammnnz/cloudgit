FROM python:3.10-alpine

SHELL [ "/bin/bash", "-c" ]

RUN pip install --upgrade pip
RUN pip install poetry

ENV PATH="/root/.local/bin:$PATH"
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /srv/www/cloudgit/apps/authentication

COPY pyproject.toml poetry.lock ./

RUN poetry config virtualenvs.create false
RUN poetry install --no-interaction --no-root

COPY . ./

ENV PYTHONPATH=/srv/www/cloudgit/apps/authentication

CMD [ "poetry", "run", "gunicorn", "-c", "gunicorn.py", "wsgi:application" ]
