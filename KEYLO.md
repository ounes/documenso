# Keylo Documenso

This repository is the Documenso fork used as the **Keylo signing service**.
It is a separate deployable service, not a package of the Reylo monorepo.

## Why a separate service

- Documenso owns its own PostgreSQL database, storage, SMTP configuration and
  signing certificate.
- The Reylo API talks to it over the Documenso v2 API and receives status
  changes through a webhook.
- Keeping it separate lets other Keylo applications reuse the same signing
  engine later without coupling them to Reylo.

## Reylo integration

Set these variables on the Reylo API:

```dotenv
SIGNATURE_PROVIDER=documenso
DOCUMENSO_URL=http://localhost:3003          # staging/prod: https://sign...
DOCUMENSO_API_KEY=...                         # Documenso API token
DOCUMENSO_WEBHOOK_SECRET=...                  # Must match the Documenso webhook
```

The Reylo webhook endpoint is:

```text
POST /api/signatures/webhook
Header: X-Documenso-Secret: <DOCUMENSO_WEBHOOK_SECRET>
```

`DOCUMENSO_URL` must use HTTPS outside local loopback. The Reylo API rejects
non-HTTPS provider URLs except `localhost`, `127.0.0.1` and `[::1]`.

## Phone signing

The fork adds a phone-only signing flow for recipients with `identityType:
PHONE` and no email. It is disabled by default:

```dotenv
KEYLO_PHONE_SIGNING_ENABLED=true
```

`REYLO_PHONE_SIGNING_ENABLED` is still accepted as a deprecated fallback.

## Local / staging / production

See [`deploy/keylo/README.md`](deploy/keylo/README.md) for:

- the local Docker Compose stack;
- the staging and production environment templates;
- the Documenso API token and webhook setup;
- the checklist to connect the service to the Reylo API.

## Upstream

This fork tracks `https://github.com/documenso/documenso.git`. Keep the
`@documenso/*` package names and upstream layout to make future rebases
predictable. Keylo-specific changes should stay small and documented here.
