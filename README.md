# Code Playground

This project is an interactive playground for exploring and learning SQL, Python, JavaScript, and C code execution in a user-friendly web interface. It is designed to help users experiment with queries and code snippets, view results instantly, and manage multiple playgrounds with ease.

## Why This Project?

This project is a hands-on exploration of how modern code execution platforms like Replit, Jupyter, or SQLFiddle work under the hood. My goal was to build a secure, browser-based environment where users can write and execute code in Python, JavaScript, SQL, and C, seeing results instantly.

### At its core, this playground combines:

**Language-specific execution layers:**

- **Python** via `subprocess` and [Pyodide](https://pyodide.org/) (for in-browser fallback)
- **SQL** using `SQLite.js` with preloaded tables like `users(id, name)` and `orders(id, user_id, amount)`
- **JavaScript** via the V8 engine or Node.js sandbox
- **C** code compiled and executed using `gcc` inside a Docker container

**Containerized sandboxing:**

All user-submitted code is executed in isolated Docker containers to ensure safe execution, memory limits, and timeout control—preventing access to the host system and other processes.

**Persistent workspace support:**

Each playground session maintains its own code and query history via `localStorage`, with potential extension to Redis/PostgreSQL for server-side persistence.

## Features

- **Multi-language Support:** Run and test SQL, Python, JavaScript, and C code.
- **Sample Data:** Each SQL playground comes with pre-populated sample tables (`users`, `orders`) for easy experimentation.
- **Query & Code History:** Automatically saves your query/code history for each playground.
- **Multiple Playgrounds:** Create, rename, and delete separate playgrounds for different experiments.
- **Instant Results:** View execution results, including tables and output, directly in the browser.
- **Responsive UI:** Built with Next.js, Tailwind CSS, and Radix UI for a modern, responsive experience.

## Getting Started

1. **Install dependencies:**
   ```sh
   npm install
   ```
2. **Run the development server:**
   ```sh
   npm run dev
   ```
3. **Open your browser:**  
   Visit [http://localhost:3000](http://localhost:3000) to start exploring!

## Project Structure

- `app/` – Main Next.js app, pages, and global styles
- `components/` – UI components (sidebar, buttons, cards, etc.)
- `hooks/` – Custom React hooks
- `lib/` – Utility functions
- `public/` – Static assets
- `styles/` – Additional global styles

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests to improve the playground.

## License

MIT

---