# Mono CLI Tool

A fast and efficient CLI tool for building and deploying projects.

## Installation

### Local Development
```bash
# Install dependencies
yarn install

# Test the CLI locally
yarn start --help
```

### Global Installation
```bash
# Install globally using yarn
yarn global add .

# Or link for development
yarn link
```

## Usage

### Build Command
```bash
# Basic build
haste build

# Build with specific environment
haste build --env production

# Build with watch mode
haste build --watch
```

### Deploy Command
```bash
# Basic deploy
haste deploy

# Deploy to specific environment
haste deploy --env staging

# Force deployment
haste deploy --force
```

## Available Commands

- `haste build` - Build the project
- `haste deploy` - Deploy the project
- `haste --help` - Show help information
- `haste --version` - Show version information

## Development

### Project Structure
```
haste/
├── bin/
│   └── haste.js          # Main CLI entry point
├── lib/
│   └── commands/
│       ├── build.js      # Build command implementation
│       └── deploy.js     # Deploy command implementation
├── package.json
└── README.md
```

### Adding New Commands

1. Create a new file in `lib/commands/`
2. Export an `execute` function
3. Add the command to `bin/haste.js`

### Dependencies

- **commander** - Command-line argument parsing
- **chalk** - Terminal string styling

## License

MIT
