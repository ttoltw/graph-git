# GraphGit

A desktop application for visualizing Git repositories as interactive directed graphs. Built with Electron, React, and TypeScript.

## About

GraphGit is designed to provide a cross-platform alternative to TortoiseGit's Revision Graph feature. While TortoiseGit's Revision Graph is a powerful tool for visualizing Git repositories on Windows, GraphGit brings similar functionality to macOS and Linux users, as well as providing a modern, consistent experience across all platforms.

## Features

- **Git Repository Visualization**: View your Git repository as a directed graph showing commits, branches, and their relationships
- **Interactive Graph**: Navigate through the commit history with smooth scrolling and zooming
- **Recent Folders**: Quick access to recently opened Git repositories
- **Cross-platform**: Works on Windows, macOS, and Linux
- **Modern UI**: Clean and intuitive interface built with React

## Screenshots

*Screenshots will be added here*

## Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Git (for repository access)

### Development Setup

1. Clone the repository:
```bash
git clone https://github.com/ttoltw/graph-git.git
cd graph-git
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

### Building for Production

To create distributable packages:

```bash
# Package the application
npm run package

# Create installers for different platforms
npm run make
```

## Usage

1. **Open a Git Repository**: Click the "open" button to select a Git repository folder
2. **View the Graph**: The application will automatically generate a visual graph of your repository's commit history
3. **Navigate**: Use mouse wheel to zoom and drag to pan around the graph
4. **Recent Folders**: Use the dropdown to quickly switch between recently opened repositories
5. **Reload**: Click the "reload" button to refresh the graph if the repository has been updated

## Technology Stack

- **Electron**: Cross-platform desktop application framework
- **React**: User interface library
- **TypeScript**: Type-safe JavaScript
- **Dagre**: Graph layout library
- **Vite**: Build tool and development server
- **Electron Forge**: Electron packaging and distribution

## Development

### Available Scripts

- `npm start` - Start the development server
- `npm run package` - Package the application
- `npm run make` - Create platform-specific installers
- `npm run lint` - Run ESLint for code quality

### Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

For more information about the MIT License, visit: https://opensource.org/licenses/MIT

## Author

- **ttol.tw** - [ttol.tw@gmail.com](mailto:ttol.tw@gmail.com)

## Acknowledgments

- [Dagre](https://github.com/dagrejs/dagre) for graph layout algorithms
- [Electron Forge](https://www.electronforge.io/) for packaging and distribution
- [React](https://reactjs.org/) for the user interface framework 