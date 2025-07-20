# Contributing to Kannon.js

Thank you for your interest in contributing to Kannon.js! This document provides comprehensive information about the project structure, development setup, and contribution guidelines.

## Table of Contents

- [Project Overview](#project-overview)
- [Technology Stack](#technology-stack)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Code Style and Standards](#code-style-and-standards)
- [Testing](#testing)
- [Building and Publishing](#building-and-publishing)
- [Protocol Buffers](#protocol-buffers)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Code of Conduct](#code-of-conduct)

## Project Overview

Kannon.js is the official Node.js client library for Kannon Email Sender. It provides a TypeScript/JavaScript SDK for sending emails through the Kannon email service using gRPC and Protocol Buffers.

### Key Features

- **TypeScript Support**: Full TypeScript definitions and type safety
- **gRPC Communication**: Uses Connect-RPC for efficient API communication
- **Protocol Buffers**: Type-safe API definitions using protobuf
- **Modern JavaScript**: ES2022+ features with ESM modules
- **Multiple Email Types**: Support for HTML emails, templates, and attachments
- **Personalization**: Dynamic field replacement and global fields
- **Scheduling**: Future email delivery capabilities

## Technology Stack

### Core Technologies

- **TypeScript**: Primary language for type safety and modern JavaScript features
- **Node.js**: Runtime environment
- **Protocol Buffers**: API definition and serialization
- **Connect-RPC**: gRPC framework for Node.js
- **ES Modules**: Modern JavaScript module system

### Development Tools

- **Buf**: Protocol buffer toolchain for API management
- **Prettier**: Code formatting
- **Vitest**: Testing framework
- **npm**: Package manager (lock file present)
- **TypeScript Compiler**: For building and type checking

### Dependencies

#### Runtime Dependencies

- `@bufbuild/protobuf`: Protocol buffer runtime
- `@connectrpc/connect`: Connect-RPC client
- `@connectrpc/connect-node`: Node.js specific Connect-RPC features

#### Development Dependencies

- `@bufbuild/buf`: Buf CLI for protobuf management
- `@bufbuild/protoc-gen-es`: ES module protobuf code generation
- `@connectrpc/protoc-gen-connect-es`: Connect-RPC code generation
- `@types/node`: Node.js type definitions
- `@vitest/ui`: Vitest UI for testing
- `prettier`: Code formatting
- `typescript`: TypeScript compiler
- `vitest`: Testing framework

## Development Setup

### Prerequisites

- Node.js (version 18 or higher recommended)
- npm (recommended) or npm
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/kannon-email/kannon.js.git
   cd kannon.js
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   npm install
   ```

3. **Generate Protocol Buffer code**

   ```bash
   npm run generate
   # or
   npm run generate
   ```

4. **Build the project**
   ```bash
   npm run build
   # or
   npm run build
   ```

### Available Scripts

- `npm run build`: Compile TypeScript to JavaScript
- `npm run format`: Format code using Prettier
- `npm run test`: Run tests (currently placeholder)
- `npm run prepare`: Build before publishing
- `npm run generate`: Generate protobuf code using Buf

## Project Structure

```
kannon.js/
├── src/
│   ├── kannon.ts          # Main client library
│   ├── recipent.ts        # Recipient type definitions
│   └── proto/             # Generated protobuf code
│       └── kannon/
│           └── mailer/
│               ├── apiv1/  # API v1 definitions
│               └── types/  # Type definitions
├── lib/                   # Compiled JavaScript output
├── .proto/                # Protocol buffer definitions (not in repo)
├── buf.yaml              # Buf configuration
├── buf.gen.yaml          # Buf code generation config
├── package.json          # Package configuration
├── tsconfig.json         # TypeScript configuration
└── README.md            # Project documentation
```

### Key Files

- **`src/kannon.ts`**: Main client implementation
- **`src/recipent.ts`**: TypeScript type definitions for recipients
- **`buf.yaml`**: Buf workspace configuration
- **`buf.gen.yaml`**: Code generation configuration for protobuf
- **`tsconfig.json`**: TypeScript compiler options

## Development Workflow

### 1. Making Changes

1. **Create a feature branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**

   - Edit source files in `src/`
   - Update protobuf definitions if needed
   - Add tests for new functionality

3. **Generate protobuf code** (if protobuf files changed)

   ```bash
   npm run generate
   ```

4. **Build the project**

   ```bash
   npm run build
   ```

5. **Format code**

   ```bash
   npm run format
   ```

6. **Run tests**
   ```bash
   npm run test
   ```

### 2. Protocol Buffer Changes

If you need to modify the API:

1. **Update `.proto` files** (in the separate protobuf repository)
2. **Regenerate code**
   ```bash
   npm run generate
   ```
3. **Update client code** to match new API
4. **Test thoroughly** with new protobuf definitions

### 3. Type Definitions

When adding new types or interfaces:

1. **Add to appropriate file** in `src/`
2. **Export from main module** if needed
3. **Update documentation** in README.md
4. **Add JSDoc comments** for public APIs

## Code Style and Standards

### Conventional Commits

This project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages. This ensures consistent commit history and enables automatic changelog generation.

#### Commit Message Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### Types

- **`feat`**: A new feature
- **`fix`**: A bug fix
- **`docs`**: Documentation only changes
- **`style`**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- **`refactor`**: A code change that neither fixes a bug nor adds a feature
- **`perf`**: A code change that improves performance
- **`test`**: Adding missing tests or correcting existing tests
- **`chore`**: Changes to the build process or auxiliary tools and libraries such as documentation generation

#### Examples

```bash
# New feature
git commit -m "feat: add support for email templates"

# Bug fix
git commit -m "fix: resolve issue with attachment handling"

# Documentation
git commit -m "docs: update API documentation"

# Breaking change
git commit -m "feat!: change API signature for sendHtml method

BREAKING CHANGE: sendHtml now requires options parameter"

# With scope
git commit -m "feat(api): add new sendTemplate method"
```

#### Breaking Changes

Breaking changes should be indicated by:

1. Adding `!` after the type/scope
2. Including `BREAKING CHANGE:` in the commit body

### TypeScript Guidelines

- Use strict TypeScript configuration
- Prefer interfaces over types for object shapes
- Use explicit return types for public functions
- Leverage TypeScript's type inference where appropriate
- Use `const` assertions for readonly data

### Code Formatting

- Use Prettier for consistent formatting
- Run `npm run format` before committing
- Follow existing code style patterns

### Naming Conventions

- **Files**: kebab-case for files, camelCase for TypeScript
- **Classes**: PascalCase (e.g., `KannonCli`)
- **Functions/Methods**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Interfaces**: PascalCase with descriptive names

### Documentation

- Use JSDoc for all public APIs
- Include examples in documentation
- Keep README.md updated with new features
- Document breaking changes clearly

## Testing

### Current Testing Setup

- **Framework**: Vitest (configured but not yet implemented)
- **UI**: Vitest UI for visual test runner
- **Coverage**: Not yet configured

### Testing Guidelines

1. **Unit Tests**: Test individual functions and methods
2. **Integration Tests**: Test API interactions
3. **Type Tests**: Ensure TypeScript types work correctly
4. **Error Handling**: Test error scenarios and edge cases

### Running Tests

```bash
# Run all tests
npm run test

# Run tests with UI
npm run test --ui

# Run tests in watch mode
npm run test --watch
```

## Building and Publishing

### Build Process

1. **TypeScript Compilation**

   ```bash
   npm run build
   ```

   - Compiles `src/` to `lib/`
   - Generates type definitions
   - Uses ES2022 target with ESM modules

2. **Pre-publish Checks**
   - Code formatting with Prettier
   - Type checking with TypeScript
   - Test execution

### Publishing

1. **Version Update**

   ```bash
   npm version patch|minor|major
   ```

2. **Build and Test**

   ```bash
   npm run build
   npm run test
   ```

3. **Publish**
   ```bash
   npm publish
   ```

## Protocol Buffers

### Overview

This project uses Protocol Buffers for API definitions and gRPC communication. The protobuf definitions are managed separately and generated into the `src/proto/` directory.

### Buf Configuration

- **`buf.yaml`**: Workspace configuration with linting and breaking change detection
- **`buf.gen.yaml`**: Code generation configuration for TypeScript and Connect-RPC

### Generated Code

The following plugins generate code:

- `buf.build/bufbuild/es`: TypeScript protobuf runtime
- `buf.build/connectrpc/es`: Connect-RPC client code

### Working with Protobuf

1. **Update protobuf definitions** in the separate repository
2. **Regenerate code**:
   ```bash
   npm run generate
   ```
3. **Update client code** to use new generated types
4. **Test thoroughly** with new API definitions

## Pull Request Guidelines

### Before Submitting

1. **Ensure code builds successfully**

   ```bash
   npm run build
   ```

2. **Run formatting**

   ```bash
   npm run format
   ```

3. **Run tests** (when implemented)

   ```bash
   npm run test
   ```

4. **Update documentation** if needed

### PR Requirements

- **Clear description** of changes
- **Related issue** if applicable
- **Breaking changes** clearly documented
- **New features** include examples
- **Bug fixes** include reproduction steps

### Review Process

1. **Automated checks** must pass
2. **Code review** by maintainers
3. **Documentation updates** if needed
4. **Test coverage** for new features

## Code of Conduct

### Our Standards

- **Respectful communication** in all interactions
- **Inclusive environment** for all contributors
- **Constructive feedback** in reviews and discussions
- **Professional behavior** in all project spaces

### Reporting Issues

- Report violations to project maintainers
- Provide specific details about the incident
- Maintain confidentiality of those involved

## Getting Help

### Resources

- **README.md**: Usage examples and API documentation
- **Issues**: Bug reports and feature requests
- **Discussions**: General questions and community support

### Contact

- **Repository**: https://github.com/kannon-email/kannon.js
- **Maintainer**: ludusrusso

## License

This project is licensed under the ISC License. By contributing, you agree that your contributions will be licensed under the same license.

---

Thank you for contributing to Kannon.js! Your contributions help make this library better for everyone in the community.
