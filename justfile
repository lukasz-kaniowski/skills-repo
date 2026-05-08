set dotenv-load := false

default:
    @just --list

install:
    pnpm install

build:
    pnpm run build

dev:
    pnpm run dev

serve:
    pnpm exec turbo run dev --filter=ui --filter=api

test:
    pnpm run test

typecheck:
    pnpm run typecheck

lint:
    pnpm run lint

clean:
    pnpm run clean

check: typecheck lint test

sandcastle:
    pnpm run sandcastle
