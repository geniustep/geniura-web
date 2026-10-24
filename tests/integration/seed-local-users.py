"""Seed synthetic candidates for local Playwright integration tests only.

Refuses production-like settings or databases. Run from WSL against geniura-api local settings:

  GENIURA_INTEGRATION_SEED=allow GENIURA_USER_PREFIX=cv-int-run python seed-local-users.py
  GENIURA_INTEGRATION_SEED=allow python seed-local-users.py --clear-throttle
"""
from __future__ import annotations

import argparse
import os
import sys

ROOT = os.environ.get("GENIURA_API_ROOT", "/home/geniura/work/geniura-partial-dates-impl")
sys.path.insert(0, ROOT)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.local")

import django

django.setup()

from django.conf import settings

from apps.accounts.models import User

DEFAULT_PASSWORD = "Integration-CV-Pass-2026!"
FORBIDDEN_DB_MARKERS = ("prod", "production", "staging", "live")


def assert_local_integration_environment() -> None:
    if os.environ.get("GENIURA_INTEGRATION_SEED") != "allow":
        sys.exit("Refusing: set GENIURA_INTEGRATION_SEED=allow for local synthetic seeding only.")

    module = os.environ.get("DJANGO_SETTINGS_MODULE", "")
    if any(marker in module for marker in ("production", "staging")):
        sys.exit(f"Refusing: DJANGO_SETTINGS_MODULE looks non-local ({module}).")

    if not settings.DEBUG:
        sys.exit("Refusing: DEBUG must be True (local/test only).")

    db = settings.DATABASES.get("default", {})
    name = str(db.get("NAME", "")).lower()
    host = str(db.get("HOST", "")).lower()
    if any(marker in name for marker in FORBIDDEN_DB_MARKERS):
        sys.exit(f"Refusing: database NAME looks non-local ({name!r}).")
    if host and host not in ("", "localhost", "127.0.0.1"):
        sys.exit(f"Refusing: database HOST must be local, got {host!r}.")


def clear_throttle_cache() -> None:
    from django.core.cache import cache

    cache.clear()
    print("throttle cache cleared")


def seed_users(prefix: str, count: int, password: str) -> None:
    for slot in range(count):
        email = f"{prefix}-{slot}@example.test"
        if User.objects.filter(email__iexact=email).exists():
            continue
        User.objects.create_user(
            email=email,
            password=password,
            signup_intent="candidate",
            preferred_locale="en",
            is_email_verified=True,
        )
        print(f"created {email}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--clear-throttle", action="store_true")
    parser.add_argument("--count", type=int, default=16)
    args = parser.parse_args()

    assert_local_integration_environment()

    if args.clear_throttle:
        clear_throttle_cache()

    if args.count <= 0:
        return

    prefix = os.environ.get("GENIURA_USER_PREFIX", "cv-int-run")
    password = os.environ.get("INTEGRATION_CV_PASSWORD", DEFAULT_PASSWORD)
    seed_users(prefix, args.count, password)


if __name__ == "__main__":
    main()
