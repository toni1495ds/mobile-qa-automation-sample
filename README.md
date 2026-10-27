# Macadam QA automation sample

This is a small example of how I would start the automation at Macadam.

I don't have access to the app or the API, so I made a simple mock server to run the API tests. The rules (coins per steps, daily limit, etc.) are my guesses from using the app. The Maestro flows use testIDs that I invented, so they won't run until we have the real ones.

## The idea

Start with a smoke of the main flows:

1. Login
2. Convert steps into coins
3. Redeem a reward

The happy path is tested with Maestro on the app, and the edge cases with API tests because they are faster and more stable (converting twice, old steps, daily limit, not enough coins, retries, seeing another user's data).

I chose Maestro because it's easy to write and maintain, and Playwright for the API because the backend is in TypeScript, so devs can also add tests.

## How to run

```bash
npm install
npm run test:api
npm run test:smoke
npm run report
```

For Maestro you need the app installed in an emulator:

```bash
npm run mock
maestro test -e API_URL=http://10.0.2.2:3333 mobile/
```

## CI

The API tests run on every PR with GitHub Actions. The Maestro job is commented until we have an app build.

## Next steps

- Agree testIDs with the devs
- Run Maestro in CI (Android first, iOS before releases)
- Add more regression: permissions, offline, Perfect Week, time zones