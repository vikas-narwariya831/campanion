# Campanion

A modern desktop application built with Electron, Vite, React, and TypeScript.

## Features

- ⚡ Fast development with Vite
- 🎨 Beautiful UI with Tailwind CSS
- 🐾 Pet management system
- 📱 Responsive dashboard

## Prerequisites

- Node.js (v14 or higher)
- npm, yarn, or pnpm

## Installation

```bash
# Install dependencies
npm install
# or
yarn install
# or
pnpm install
```

## Development

```bash
# Start development server
npm run dev
```

This will start the Electron application in development mode with hot module replacement.

## Build

```bash
# Build for production
npm run build
```

The built application will be available in the `dist` folder.

## Project Structure

```
src/
├── main/           # Electron main process
├── preload/        # Preload scripts for IPC communication
└── renderer/       # React frontend
    ├── components/ # Reusable React components
    │   └── Pet/
    └── pages/      # Page components
        ├── Dashboard
        └── Pet
```

## Configuration

- **Electron**: See `electron.vite.config.ts`
- **Tailwind CSS**: See `tailwind.config.js`
- **PostCSS**: See `postcss.config.js`
- **TypeScript**: See `tsconfig.json`

## License

MIT

## Author

Vikas Narwariya
