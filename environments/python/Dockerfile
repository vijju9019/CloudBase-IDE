FROM python:3.12-slim

# Install common development build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Non-root user for security
RUN useradd -m -u 1000 cloudbase
USER cloudbase

WORKDIR /workspace

CMD ["/bin/sh"]
