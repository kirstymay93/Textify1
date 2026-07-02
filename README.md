# Textify

A TypeScript-based text processing and editing application with a modern frontend and robust backend infrastructure.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [CI/CD](#cicd)
- [Branch Strategy](#branch-strategy)
- [Contributing](#contributing)
- [Development Workflow](#development-workflow)

## Features

- 📝 Advanced text editing capabilities with layer management
- ⚙️ Robust backend architecture with TRPC
- 🎨 Modern, responsive UI built with React and Tailwind CSS
- 🔧 Modular component structure
- 📦 TypeScript for type safety
- 🧪 Comprehensive test coverage with Jest
- 🔄 Automated CI/CD with GitHub Actions
- 🎯 Layer-based text editing with real-time preview
- 🖼️ Image analysis and text detection
- 💾 Project management and persistence

## Tech Stack

- **Language**: TypeScript
- **Frontend**: React 18, Vite, Tailwind CSS
- **Backend**: Node.js with TRPC
- **Testing**: Jest, React Testing Library
- **Version Control**: Git with organized branch strategy
- **CI/CD**: GitHub Actions

## Installation

1. Clone the repository:
```bash
git clone https://github.com/kirstymay93/Textify1.git
cd Textify1
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (create `.env` file):
```bash
VITE_API_URL=http://localhost:3000
```

## Usage

### Development Server

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

Build the optimized production bundle:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Project Structure

```
Textify1/
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # Base UI components (button, etc.)
│   │   ├── Editor.tsx      # Main editor component
│   │   ├── LayerBasedEditor.tsx  # Layer-based editor
│   │   ├── EditorHeader.tsx
│   │   ├── CanvasArea.tsx
│   │   ├── EditorSidebar.tsx
│   │   ├── EditorErrorBoundary.tsx
│   │   └── __tests__/
│   ├── hooks/              # Custom React hooks
│   │   ├── useLayerState.ts
│   │   ├── useEditorStore.ts
│   │   └── __tests__/
│   ├── lib/                # Utility functions and types
│   │   ├── layerSystem.ts
│   │   ├── trpc.ts
│   │   └── __tests__/
│   ├── _core/              # Core functionality
│   │   └── hooks/
│   │       └── useAuth.ts
│   ├── test/               # Test configuration
│   │   └── setup.ts
│   ├── App.tsx             # Root app component
│   ├── main.tsx            # Entry point
│   └── vite-env.d.ts
├── .github/
│   └── workflows/          # GitHub Actions CI/CD
│       ├── test.yml
│       └── build.yml
├── public/                 # Static assets
├── dist/                   # Build output (generated)
├── index.html              # HTML entry point
├── index.css               # Global styles
├── package.json
├── tsconfig.json
├── vite.config.ts
├── jest.config.js
└── README.md
```

## Testing

Run tests in watch mode:
```bash
npm run test:watch
```

Run all tests once:
```bash
npm test
```

Generate coverage report:
```bash
npm run test:coverage
```

## CI/CD

This repository uses GitHub Actions for automated testing and building:

- **test.yml**: Runs lint, tests, and builds on Node 20.x for pushes and pull requests
- **build.yml**: Validates TypeScript and builds the project

All workflows run on push to `main` and `develop` branches and on pull requests.

## Branch Strategy

This repository uses a **Git Flow** branching model:

### Main Branches
- **`main`** - Production-ready code (stable releases)
- **`develop`** - Integration branch for features and fixes

### Feature Branches
- **`feature/backend`** - Backend development
- **`feature/frontend`** - Frontend/UI development
- **`feature/editor`** - Editor component enhancements

### Maintenance Branches
- **`bugfix/*`** - Bug fixes and patches
- **`fix/*`** - General fixes and improvements

## Contributing

1. Fork the repository
2. Create a feature branch from `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```
3. Make your changes and commit:
   ```bash
   git add .
   git commit -m "Description of changes"
   ```
4. Push to remote:
   ```bash
   git push origin feature/your-feature-name
   ```
5. Create a Pull Request to `develop`
6. Ensure all tests pass and code review is approved
7. Merge to `develop`, then create PR to `main` for release

## Development Workflow

### Creating a Feature

1. Create a new branch from `develop`:
```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

2. Make your changes:
   - Write code following the project conventions
   - Add tests for new functionality
   - Update documentation as needed

3. Run tests and linting:
```bash
npm test
npm run lint
```

4. Commit your changes:
```bash
git add .
git commit -m "feat: Description of changes"
```

5. Push to remote:
```bash
git push origin feature/your-feature-name
```

6. Create a Pull Request:
   - Use a clear title and description
   - Reference any related issues
   - Ensure all CI/CD checks pass

### Merging to Production

1. Create a PR from `develop` to `main`
2. Ensure all tests pass
3. Get peer review and approval
4. Merge to `main`
5. Create a release/tag for the version

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Author

kirstymay93

---

**Last Updated**: June 29, 2026
