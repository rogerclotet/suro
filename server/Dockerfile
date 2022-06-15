FROM python:3.10

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN pip install pip-tools

WORKDIR /code

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . /code
