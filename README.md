# Companion — Desktop AI Productivity Assistant

Companion is a modern desktop productivity application designed to help users stay focused during work sessions. It intelligently monitors the active window, detects distractions, and enforces discipline through real-time alerts and session management.

Built with **Electron, React, TypeScript, and Vite**, Companion delivers a smooth desktop experience with a responsive and visually engaging interface.

---

## Overview

Many developers and professionals struggle with frequent distractions from social media, video platforms, and non-work-related tabs. Companion was created to solve this problem by providing an automated accountability system that keeps users focused on their tasks.

**Key Goal:** Improve deep work consistency and productivity through intelligent monitoring and behavioral feedback.

---

## Core Features

* Real-time active window tracking
* Distraction detection during focus sessions
* Automated warning alerts using voice notifications
* Session timer reset when distractions persist
* Floating desktop companion interface
* Fast and responsive UI built with modern frontend technologies
* Cross-platform desktop support (Windows, macOS, Linux)

---

## Tech Stack

**Frontend**

* React
* TypeScript
* Tailwind CSS
* Framer Motion

**Desktop Framework**

* Electron
* Electron IPC Communication

**Build Tools**

* Vite
* PostCSS

**APIs & Capabilities**

* Web Speech API (Voice Alerts)
* Node.js System APIs

---

## Prerequisites

Before running the project, ensure the following are installed:

* Node.js (v14 or higher recommended: v18+)
* npm, yarn, or pnpm
* Git

---

## Installation

Clone the repository and install dependencies.

```bash
git clone https://github.com/vikas-narwariya831/campanion
cd campanion

npm install
```

Alternative package managers:

```bash
yarn install
```

or

```bash
pnpm install
```

---

## Running the Application (Development)

Start the development server with hot reload support.

```bash
npm run dev
```

This will:

* Launch the Electron desktop application
* Start the Vite development server
* Enable hot module replacement

---

## Building for Production

Generate a production-ready build of the application.

```bash
npm run build
```

The compiled application will be available in the following directory:

```bash
dist/
```

---

## Project Structure

```
src/
├── main/              # Electron main process
├── preload/           # Secure IPC bridge scripts
└── renderer/          # React frontend application
    ├── components/    # Reusable UI components
    ├── hooks/         # Custom React hooks
    ├── services/      # Business logic and utilities
    └── pages/         # Application screens
```

---

## Use Cases

* Developers working in remote environments
* Students preparing for exams
* Professionals managing deep work sessions
* Anyone struggling with digital distractions

---

## Performance Goals

* Minimal system resource usage
* Fast startup time
* Responsive UI animations
* Reliable background monitoring

---

## Future Improvements

* AI-based distraction classification
* Productivity analytics dashboard
* Customizable focus rules
* Idle detection and reporting
* Pomodoro timer integration
* Multi-monitor support
* System tray controls

---

## Security Considerations

* No user data is transmitted externally
* Local-only monitoring of active windows
* Secure IPC communication between processes
* No credential storage in source code

---

## Contributing

Contributions are welcome.

If you would like to contribute:

1. Fork the repository
2. Create a new feature branch
3. Commit your changes
4. Submit a pull request

---

## License

This project is licensed under the **MIT License**.

---

## Author

**Vikas Narwariya**
Software Engineer | React Developer | Full Stack Enthusiast

* GitHub: [https://github.com/vikas-narwariya831](https://github.com/vikas-narwariya831)
* LinkedIn: Add your LinkedIn profile here

---

## Support

If you find this project useful, consider:

* Starring the repository
* Sharing feedback
* Suggesting improvements
* Reporting issues
