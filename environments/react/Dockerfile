FROM node:22-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

USER node

WORKDIR /workspace

EXPOSE 5173

CMD ["/bin/sh"]
