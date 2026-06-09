# Task: SETUP-003 - Configure frontend tooling

## Metadata
- Status: pending
- Estimate: 45m
- Depends on: SETUP-001

## Files to Modify
- `frontend/package.json` CREATE
- `frontend/app/` CREATE
- `frontend/components/` CREATE
- `frontend/features/` CREATE
- frontend Tailwind/Next config files CREATE

## Description
Set up the Next.js App Router frontend with Tailwind CSS and the chosen icon package.

## Requirements
- Use Next.js App Router.
- Configure Tailwind according to installed version.
- Install/use `@phosphor-icons/react`.
- Add Framer Motion only if approved and recorded in dependencies.
- Use no emoji in UI content.

## Verification
```bash
npm --prefix frontend run build
```

## Notes
- Check package versions before writing syntax that depends on Tailwind v3/v4.
