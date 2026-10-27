# Macadam QA automation sample

A small example of how I would start the test automation for Macadam.

I don't have access to the app or the API, so:

- The **API tests** run against a small mock server (`mock-server/`) that I wrote following how the app works publicly (steps → coins, converting before midnight, daily step limit, gift cards). The numbers are my guesses.
- The **Maestro flows** are written with `testID`s I made up. They would need the real IDs from the app to run.

## Approach

I'd start with a **smoke suite** of the most important flows instead of trying to cover everything:

1. Log in and see today's steps and coins
2. Convert steps into coins
3. Redeem a reward

The happy path goes in Maestro (real app, slower), and the edge cases go in API tests (faster and more stable): converting twice, expired steps, the daily limit, not enough coins, retried requests and users seeing other users' data.

**Why Maestro:** simple YAML, automatic waits so tests are less flaky, and manual QA can also write flows. Detox would be an option if we need more speed later.

**Why Playwright for the API:** the backend is TypeScript, so developers can read and add tests. I use Zod to check the response format.

## Structure

```
api/
  tests/          auth, steps, rewards
  helpers.ts      create users, add steps, redeem...
  schemas.ts      expected response formats (Zod)
mobile/
  flows/          3 smoke flows + reusable login
  scripts/        create test data through the API
mock-server/      fake backend for running the API tests locally
.github/workflows/tests.yml
```

## Run

```bash
npm install
npm run test:api     # all API tests
npm run test:smoke   # only smoke
npm run report       # HTML report
```

Against a real environment: `BASE_URL=https://staging... npm run test:api`

Maestro (with the app installed on an emulator):

```bash
npm run mock
maestro test -e API_URL=http://10.0.2.2:3333 mobile/
```

## CI

GitHub Actions runs the API tests on every pull request. The Maestro job is ready but commented out until there's an app build to install.

## Next steps

- Agree on `testID`s with the developers
- Run the smoke flows on Android in CI, iOS before releases
- Add regression: permissions, offline, Perfect Week, time zones around midnight
- Track flaky tests and how long the pipeline takes
