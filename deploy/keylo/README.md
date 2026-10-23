# Keylo Documenso deployment

This directory contains the deployment templates for the Keylo signing
service. The service is a Documenso fork with a phone-only signing flow.

## Local

```bash
cd deploy/keylo
cp env.local.example env.local
# Replace every CHANGE_ME value.
docker compose up --build
```

- Documenso: <http://localhost:3003>
- Mailpit: <http://localhost:8025>
- PostgreSQL: internal to the Compose network.

Create the first admin account in the Documenso UI. Then create:

1. **API token** — Settings → API Tokens. Copy the token once and set it as
   `DOCUMENSO_API_KEY` on the Reylo API.
2. **Webhook** — Settings → Webhooks.
   - URL: `http://host.docker.internal:4000/api/signatures/webhook`
   - Secret: the value of `DOCUMENSO_WEBHOOK_SECRET` on the Reylo API.
   - Events: envelope completed / recipient signed / document declined.

On the Reylo API:

```dotenv
SIGNATURE_PROVIDER=documenso
DOCUMENSO_URL=http://localhost:3003
DOCUMENSO_API_KEY=<token>
DOCUMENSO_WEBHOOK_SECRET=<secret>
```

## Staging

Use `env.staging.example` as the variable list. Deploy the Docker image or run
the service on your platform of choice (Fly.io, Render, ECS, Kubernetes, …).

Requirements:

- PostgreSQL with backups.
- S3-compatible storage (or database storage for a small staging instance).
- SMTP with a verified sending domain.
- A signing certificate (`.p12`) mounted as a secret.
- HTTPS on `sign.staging.keylo.fr`.
- The webhook URL must be reachable from Documenso:
  `https://api.staging.keylo.fr/api/signatures/webhook`.

On the Reylo API:

```dotenv
SIGNATURE_PROVIDER=documenso
DOCUMENSO_URL=https://sign.staging.keylo.fr
DOCUMENSO_API_KEY=<staging token>
DOCUMENSO_WEBHOOK_SECRET=<staging secret>
```

## Production

Use `env.production.example` as the variable list. Apply the same requirements
as staging, plus:

- Managed PostgreSQL with point-in-time recovery.
- S3 versioning and a retention policy for signed PDFs, audit logs and
  certificates.
- A dedicated signing certificate stored in a secret manager.
- SMTP with SPF, DKIM and DMARC.
- Monitoring on `/api/health` and the webhook delivery queue.
- A documented incident response and key rotation procedure.

On the Reylo API:

```dotenv
SIGNATURE_PROVIDER=documenso
DOCUMENSO_URL=https://sign.keylo.fr
DOCUMENSO_API_KEY=<production token>
DOCUMENSO_WEBHOOK_SECRET=<production secret>
```

## Multi-application reuse

The service is already a standalone Documenso instance. To share it between
Keylo applications:

- Use one Documenso team/environment per application or tenant.
- Issue one API token per application and route webhooks to the owning
  application.
- Keep branding neutral, or configure per-tenant branding.
- Do not share the production API token across applications.

The Reylo integration currently uses one API token and stores the Reylo
`agencyId` in the envelope metadata. That is sufficient for Reylo; a shared
service should add an explicit application namespace before onboarding a second
consumer.

## Verification checklist

- `GET /api/health` returns `200`.
- A test envelope can be created through the Reylo API.
- The signing link opens in a private browser window.
- Signing completes and the Reylo webhook returns `200`.
- The envelope reaches `COMPLETED` and the signed PDF/audit/certificate are
  retrievable.
- The Reylo signature credit is captured exactly once.
