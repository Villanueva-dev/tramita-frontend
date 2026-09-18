# Deployment checklist

## Cross-origin public form

Before deployment, when the public frontend and backend use different origins, add the public frontend origin to the backend CORS allowlist. Use the exact origin: scheme and host, plus the port when it is non-default. Do not use a wildcard.

- [ ] Confirm the public frontend origin is allowlisted by the backend before release.
