FROM gcc:13

RUN apt-get update && apt-get install -y --no-install-recommends \
    cmake \
    make \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

CMD ["/bin/sh"]
