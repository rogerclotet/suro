FROM python:3.10

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN pip install pip-tools

WORKDIR /code

COPY requirements.txt .
COPY requirements.dev.txt .

ARG REQUIREMENTS_FILES=requirements.txt
RUN pip-sync ${REQUIREMENTS_FILES}

COPY . /code
