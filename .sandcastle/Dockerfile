FROM node:22-bookworm

# Install system dependencies
RUN apt-get update && apt-get install -y \
  git \
  curl \
  jq \
  && rm -rf /var/lib/apt/lists/*

# Install GitHub CLI
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
  | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
  && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
  | tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
  && apt-get update && apt-get install -y gh \
  && rm -rf /var/lib/apt/lists/*

# Enable corepack and pre-install pnpm so no interactive prompt or network
# fetch is needed when "pnpm install" runs inside the sandbox.
RUN corepack enable && corepack prepare pnpm@10.17.1 --activate
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
# Make pnpm run non-interactively (e.g. auto-remove incompatible modules
# directory when host node_modules are copied in for a different platform).
ENV CI=true
# Pin the pnpm store and global bin to the agent's home so:
#   1) the store doesn't leak into the bind-mounted workspace, and
#   2) the store path is stable for cross-run caching via a bind mount.
ENV PNPM_HOME=/home/agent/.local/share/pnpm
ENV npm_config_store_dir=/home/agent/.pnpm-store
ENV PATH="${PNPM_HOME}:${PATH}"

# Rename the base image's "node" user (UID 1000) to "agent".
# This keeps UID 1000 so that --userns=keep-id (Podman) and
# --user 1000:1000 (Docker) map to the correct home directory owner.
RUN groupmod -n agent node \
  && usermod -d /home/agent -m -l agent node \
  && chown -R agent:agent /home/agent

USER agent

# Install Claude Code CLI
RUN curl -fsSL https://claude.ai/install.sh | bash

# Add Claude to PATH
ENV PATH="/home/agent/.local/bin:$PATH"

# Sandcastle's Docker provider runs the container with --user $HOST_UID:$HOST_GID
# (e.g. 501:20 on macOS), which doesn't match the agent user (UID 1000) that owns
# /home/agent. Make /home/agent and everything inside it world-writable so tools
# like git, pnpm/corepack, and claude can create config and cache files
# (.gitconfig, .cache/node/corepack, etc.) regardless of the runtime UID.
# This must run AFTER all installs so it covers files they created (e.g. .cache).
USER root
RUN chmod -R a+rwX /home/agent
USER agent

WORKDIR /home/agent

# In worktree sandbox mode, Sandcastle bind-mounts the git worktree at /home/agent/workspace
# and overrides the working directory to /home/agent/workspace at container start.
# Structure your Dockerfile so that /home/agent/workspace can serve as the project root.
ENTRYPOINT ["sleep", "infinity"]
