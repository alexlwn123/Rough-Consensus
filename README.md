# Rough Consensus - Debate Voting Platform for Bitcoin Events

> Where great minds don't think alike

**Rough Consensus** is a platform to facilitate live judging for oxford-style debates.

While developed for Bitcoin++ conferences, this certainly can be used for other debate topics. Aside from branding, there's nothing bitcoin related in the tool.

## Usage

- **[BTC++ Mempool Edition: Filters Debate](https://www.youtube.com/watch?v=GnWaSDipuVY)** - Motion: Uncapping datacarrier (OP_RETURN) by default in bitcoin core will benefit the bitcoin network.
- **[BTC++ Mempool Edition: Ossification Debate](https://www.youtube.com/watch?v=GnWaSDipuVY)** - Motion: Ossification is a greater threat to bitcoin than new upgrades.

## Features

- 🔐 **Authentication**: GitHub and Google OAuth
- 💬 **Debate Management**: Create, join, and participate in debates
- 📊 **Real-time Updates**: Track ongoing debates and their progress
- 📅 **Debate Scheduling**: View upcoming debates and past discussions
- 🎯 **Phase-based Structure**: Organized debate phases (pre, ongoing, post)

## Tech Stack

- **Vibes**: bolt.new + Claude Code + Cursor
- **Frontend**: React + TypeScript
- **Styling**: TailwindCSS
- **Backend and database**: Convex
- **Authentication**: GitHub and Google through Convex Auth
- **Real-time**: Convex reactive queries

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/alexlwn123/Rough-Consensus.git debate-voting
cd debate-voting
```

2. Install dependencies:

```bash
pnpm install
```

3. Connect your development Convex deployment:

```bash
pnpm exec convex dev
```

The CLI writes the deployment and public URL to `.env.local`. See [.env.example](.env.example). Set OAuth credentials and JWT configuration **on the Convex deployment**, as described in the [migration runbook](docs/convex-migration-status.md). OAuth secrets must never use a `VITE_` prefix.

4. In another terminal, start the frontend:

```bash
pnpm dev
```

5. Validate changes:

```bash
pnpm test:run
pnpm lint
pnpm build
```

## Backend behavior

Public debate URLs retain their UUIDs. A signed-in visitor joins through `?id=<UUID>` invitations. Backend mutations enforce administrator roles, debate membership, the active phase, and one ballot per user. Post voting requires a pre vote. Finished results are public aggregates; each user can read only their own ballot.

The migration lock blocks application writes until the imported snapshot is verified and explicitly opened. Development and production have separate locks. See the [migration status and cutover runbook](docs/convex-migration-status.md) before importing, deploying, or enabling writes. Historical SQL remains under `supabase/migrations` for reconciliation and recovery.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see the [LICENSE](LICENSE) file for details.
