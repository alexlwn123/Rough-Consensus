# AGENTS.md - Guide for AI Assistants

## Commands

- Development: `pnpm dev` or `yarn dev`
- Build: `pnpm build` or `yarn build`
- Lint: `pnpm lint` or `yarn lint`
- Preview: `pnpm preview` or `yarn preview`
- Always use `zsh` for shell commands

## Code Style

- TypeScript with strict mode enabled
- React with functional components and hooks
- Use TSX for React components
- File naming: PascalCase for components, camelCase for utilities
- Import ordering: React → external libraries → internal modules → types
- Prefer function declarations for components: `function Component() {...}`
- Use Tailwind CSS for styling
- Enforce strict types, avoid `any`
- Use error boundaries for error handling
- Code organization: Keep components in appropriate subdirectories
- Context API for state management
- Convex for backend services; shared application types live in `shared/domain.ts`
- Lucide icons for UI elements

## Project Structure

- React + Vite + TypeScript + TailwindCSS
- D3 with d3-sankey for visualization
- React Router for navigation

## Backend changes

- Enforce identity, membership, roles, and voting phases in Convex functions; the browser is untrusted.
- Preserve public debate UUIDs and provider-account identity mappings when changing storage.
- Before imports, cutover, or enabling writes, read [the migration runbook](docs/convex-migration-status.md) for deployment state and verification requirements.
- Run `pnpm test:run`, `pnpm lint`, and `pnpm build` after backend or frontend integration changes.
