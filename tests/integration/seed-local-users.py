"""Seed synthetic candidates for local integration tests only.

Requires explicit acknowledgement and a local-only Django settings module/database.
Does not clear shared caches, throttle keys, sessions, or production data.
"""
from __future__ import annotations

import argparse
import os
import re
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
SAFE_PREFIX_RE = re.compile(r"^[a-zA-Z0-9][a-zA-Z0-9-]{0,48}$")


def assert_local_integration_environment() -> None:
    if os.environ.get("GENIURA_INTEGRATION_SEED") != "allow":
        sys.exit("Refusing: GENIURA_INTEGRATION_SEED=allow is required.")

    module = os.environ.get("DJANGO_SETTINGS_MODULE", "")
    if module != "config.settings.local":
        sys.exit(f"Refusing: Django settings must be config.settings.local (got {module!r}).")

    if not settings.DEBUG:
        sys.exit("Refusing: DEBUG must be True (local only).")

    db = settings.DATABASES.get("default", {})
    name = str(db.get("NAME", "")).lower()
    host = str(db.get("HOST", "")).lower()
    if not name or any(marker in name for marker in FORBIDDEN_DB_MARKERS):
        sys.exit(f"Refusing: database NAME does not look safe ({name!r}).")
    if host not in ("", "localhost", "127.0.0.1", "::1"):
        sys.exit(f"Refusing: database HOST must be local, got {host!r}.")

    # No cache operations. A localhost database alone does not make a Redis
    # instance safe to flush: Redis may be shared with other applications.


def seed_users(prefix: str, count: int, password: str) -> None:
    if not SAFE_PREFIX_RE.fullmatch(prefix):
        sys.exit("Refusing: GENIURA_USER_PREFIX must contain only letters, digits, hyphens (max 49).")
    if count > 20 or count < 0:
        sys.exit("Refusing: --count must be between 0 and 20.")
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
    parser.add_argument("--count", type=int, default=16)
    args = parser.parse_args()

    assert_local_integration_environment()
    if args.count <= 0:
        return

    prefix = os.environ.get("GENIURA_USER_PREFIX", "cv-int-run")
    password = os.environ.get("INTEGRATION_CV_PASSWORD", DEFAULT_PASSWORD)
    seed_users(prefix, args.count, password)


if __name__ == "__main__":
    main()
