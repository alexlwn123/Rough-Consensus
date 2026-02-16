# Rough Consensus - Debate Voting Platform for Bitcoin Events

> Where great minds don't think alike

**Rough Consensus** is a platform to facilitate live judging for oxford-style debates.

While developed for Bitcoin++ conferences, this certainly can be used for other debate topics. Aside from branding, there's nothing bitcoin related in the tool.

## Usage
- **[BTC++ Mempool Edition: Filters Debate](https://www.youtube.com/watch?v=GnWaSDipuVY)** - Motion: Uncapping datacarrier (OP_RETURN) by default in bitcoin core will benefit the bitcoin network.
- **[BTC++ Mempool Edition: Ossification Debate](https://www.youtube.com/watch?v=GnWaSDipuVY)** - Motion: Ossification is a greater threat to bitcoin than new upgrades.

## Features

- 🔐 **GitHub Authentication**: Secure login through GitHub OAuth
- 💬 **Debate Management**: Create, join, and participate in debates
- 📊 **Real-time Updates**: Track ongoing debates and their progress
- 📅 **Debate Scheduling**: View upcoming debates and past discussions
- 🎯 **Phase-based Structure**: Organized debate phases (pre, ongoing, post)

## Tech Stack

- **Vibes**: bolt.new + Claude Code + Cursor
- **Frontend**: React + TypeScript
- **Styling**: TailwindCSS
- **Backend**: Supabase
- **Authentication**: GitHub OAuth via Supabase Auth
- **Database**: PostgreSQL (via Supabase)
- **Real-time**: Supabase Realtime

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/rough-consensus/debate-voting.git
cd debate-voting
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up environment variables:
   Create a `.env` file with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GITHUB_CLIENT_ID=your_github_client_id
```

4. Start the development server:

```bash
npm run dev
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see the [LICENSE](LICENSE) file for details.
