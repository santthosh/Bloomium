# Contributing to Bloomium

Thank you for your interest in contributing to Bloomium! 🪷

## License Agreement

By contributing to Bloomium, you agree that your contributions will be licensed under the Elastic License 2.0.

## What We're Looking For

We welcome contributions that improve:
- 🐛 Bug fixes
- 📚 Documentation improvements
- 🧪 Test coverage
- 🎨 UI/UX enhancements
- 🔬 Scientific accuracy of bloom detection algorithms
- 🌍 Support for additional regions or data sources

## What We're NOT Looking For

Please **do not** submit contributions that:
- Create competing commercial services
- Remove or circumvent licensing restrictions
- Add dependencies that conflict with our license

## How to Contribute

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**
4. **Test thoroughly**: Ensure all services still work
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to your fork**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

## Development Setup

See [README.md](./README.md#-quick-start) for local development setup.

## Code Style

- Use TypeScript strict mode
- Follow existing code patterns
- Add comments for complex logic
- Keep functions small and focused

## Testing

Before submitting:
```bash
# Run type checking
pnpm typecheck

# Build all services
pnpm build

# Test worker
pnpm generate:demo

# Test API
pnpm dev:api

# Test web
pnpm dev:web
```

## Questions?

Open an issue or discussion for questions about:
- Architecture decisions
- Feature requests
- Integration with other data sources
- Commercial licensing

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn
- Assume good intentions

Thank you for helping improve Bloomium! 🌸

