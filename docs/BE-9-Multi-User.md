# BE-9: Multi-User Support — Design Notes

## Overview

Add multi-user capabilities so multiple people can use the retirement simulator with separate, secure data. Currently the app is single-user with data stored in browser localStorage.

## Value Proposition

- **Shared device**: Multiple household members each with their own portfolio
- **Cross-device**: Access portfolio from phone, tablet, or desktop
- **Advisor use**: Financial advisor running scenarios for multiple clients
- **Data safety**: Server-side storage survives browser clears, device changes

## Architecture

### Authentication

Use OAuth 2.0 with social providers. Recommended providers (by adoption rate for financial tools):

1. **Google** — Highest adoption, easiest with GCP (Firebase Auth or Cloud Identity Platform)
2. **Apple** — Required for iOS distribution, good privacy posture
3. **Facebook** — Wide reach but lower trust for financial apps

**Recommendation**: Start with Google OAuth via Firebase Authentication. It handles token refresh, session management, and integrates with Cloud Run's IAM. Add Apple/Facebook later.

### Data Storage

**Cloud Firestore** (GCP native, serverless):
```
users/
  {uid}/
    profile: { primaryName, spouseName, createdAt, updatedAt }
    portfolios/
      {portfolioId}: { config, accounts, name, isDefault }
    snapshots/
      {snapshotId}: { simulationResult, timestamp, parameters }
```

- **Encryption at rest**: Firestore encrypts all data at rest by default (Google-managed keys). For additional control, use Customer-Managed Encryption Keys (CMEK) via Cloud KMS.
- **Encryption in transit**: All Firestore RPCs use TLS.
- **Access rules**: Firestore Security Rules ensure users can only read/write their own documents:
  ```
  match /users/{userId}/{document=**} {
    allow read, write: if request.auth != null && request.auth.uid == userId;
  }
  ```

### API Changes

New endpoints:
```
POST   /api/v1/auth/login     — Exchange OAuth token for session
DELETE /api/v1/auth/logout     — Invalidate session
GET    /api/v1/portfolios      — List user's portfolios
POST   /api/v1/portfolios      — Save portfolio
GET    /api/v1/portfolios/{id} — Load portfolio
DELETE /api/v1/portfolios/{id} — Delete portfolio
```

Existing `/simulate` and `/monte-carlo` endpoints remain stateless — they accept a portfolio in the request body and don't require auth. Auth is only needed for persistence.

### Session Management

- Firebase Auth issues JWTs. The FastAPI backend validates them using `firebase-admin` SDK.
- Middleware extracts user ID from the JWT and injects it into request context.
- Unauthenticated requests can still use simulation endpoints (guest mode).

## Security Considerations

1. **Data Isolation**: Firestore Security Rules + backend validation ensure users never access each other's data.

2. **Token Validation**: Always validate Firebase ID tokens server-side. Never trust client-provided user IDs.

3. **HTTPS Only**: Cloud Run enforces HTTPS by default. Set `Strict-Transport-Security` headers.

4. **CORS**: Restrict allowed origins to the deployed frontend URL.

5. **Rate Limiting**: Add per-user rate limiting (e.g., 100 API calls/minute) using Cloud Armor or middleware.

6. **Data Retention**: Implement data export (JSON download of all user data) and account deletion to comply with privacy expectations.

7. **No PII Beyond Necessary**: The app stores names and ages. No SSN, account numbers, or real financial institution data. OFX imports are parsed client-side and only balances are stored.

8. **Audit Logging**: Enable Cloud Audit Logs for Firestore access patterns.

## Migration Path

1. **Phase 1 — Optional Auth**: Add Firebase Auth login button. Logged-in users can save/load portfolios. Anonymous users continue with localStorage (current behavior).

2. **Phase 2 — Cloud Storage**: Migrate save/load from localStorage to Firestore. Add portfolio list and management UI.

3. **Phase 3 — Multi-Provider**: Add Apple and Facebook OAuth providers via Firebase Auth configuration.

## Dependencies

- `firebase-admin` Python SDK (backend JWT validation)
- Firebase Authentication (GCP console setup)
- Cloud Firestore (GCP console setup)
- UI: Login button in AppBar, portfolio list/save/load UI

## Cost Estimates (GCP)

- **Firebase Auth**: Free for up to 10K monthly active users
- **Firestore**: Free tier covers 50K reads, 20K writes, 1GB storage/day
- **Cloud Run**: Free tier covers 2M requests/month
- **Realistic cost for <100 users**: $0-5/month
