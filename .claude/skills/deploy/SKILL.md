# Deploy Skill

Auto-invoked workflow for deploying the application.

## Trigger

Use when asked to deploy, release, or ship the application to any environment.

## Workflow

1. Verify all tests pass
2. Check for uncommitted changes
3. Build the application
4. Run pre-deployment checks
5. Deploy to target environment
6. Run smoke tests post-deployment
7. Report deployment status

## Environments

- `staging` — default, for QA verification
- `production` — requires explicit confirmation

## Rollback

If deployment fails, automatically trigger rollback to last known good state.
