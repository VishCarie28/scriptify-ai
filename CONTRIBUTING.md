# Contributing to Scriptify AI

Thank you for your interest in contributing to Scriptify AI! We welcome contributions from the community and are grateful for any help you can provide.

## 🤝 How to Contribute

### Getting Started

1. **Fork the Repository**
   - Click the "Fork" button on the top right of the [repository page](https://github.com/VishCarie28/scriptify-ai)
   - This creates a copy of the repository in your GitHub account

2. **Clone Your Fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/scriptify-ai.git
   cd scriptify-ai
   ```

3. **Set Up Remote**
   ```bash
   # Add the original repository as 'upstream'
   git remote add upstream https://github.com/VishCarie28/scriptify-ai.git
   
   # Verify remotes
   git remote -v
   ```

4. **Install Dependencies**
   ```bash
   # Install Node.js dependencies
   npm install
   
   # Install Python dependencies
   pip install -r requirements.txt
   
   # Install Playwright browsers
   playwright install
   ```

### Making Changes

1. **Create a Feature Branch**
   ```bash
   # Make sure you're on main and up-to-date
   git checkout main
   git pull upstream main
   
   # Create a new branch for your feature
   git checkout -b feature/amazing-feature
   ```
   
   **Branch Naming Convention:**
   - `feature/` - New features
   - `bugfix/` or `fix/` - Bug fixes
   - `docs/` - Documentation updates
   - `refactor/` - Code refactoring
   - `test/` - Test additions or updates
   - `chore/` - Maintenance tasks

2. **Make Your Changes**
   - Write clean, readable code
   - Follow existing code style and conventions
   - Add comments for complex logic
   - Update documentation if needed

3. **Test Your Changes**
   ```bash
   # Run tests
   npm test
   
   # Run specific test suites
   python scripts/run_tests.py
   ```

4. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "Add amazing feature"
   ```
   
   **Commit Message Guidelines:**
   - Use present tense ("Add feature" not "Added feature")
   - Be descriptive but concise
   - Reference issue numbers if applicable: "Fix #123: Description"

5. **Push to Your Fork**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **Open a Pull Request**
   - Go to your fork on GitHub
   - Click "Compare & pull request"
   - Fill out the PR template:
     - **Title**: Clear description of changes
     - **Description**: Explain what and why
     - **Type**: Feature, Bug Fix, Documentation, etc.
     - **Testing**: How you tested your changes
   - Submit the PR

### Pull Request Guidelines

- **One PR per feature/fix**: Keep PRs focused and manageable
- **Keep PRs small**: Smaller PRs are easier to review
- **Update documentation**: If you add features, update the README
- **Add tests**: Include tests for new functionality
- **Follow code style**: Use existing formatting (Prettier for JS, Black for Python)
- **Be responsive**: Respond to review comments promptly

### Code Style

**JavaScript/Node.js:**
- Use ESLint and Prettier (configuration included)
- Follow existing naming conventions
- Use async/await for asynchronous code

**Python:**
- Follow PEP 8 style guide
- Use meaningful variable names
- Add docstrings to functions and classes

**General:**
- Keep functions small and focused
- Write self-documenting code
- Add comments for complex logic only

### Testing Requirements

- New features should include tests
- Bug fixes should include regression tests
- Ensure all existing tests pass
- Aim for good test coverage

### Review Process

1. **Automated Checks**: Your PR will run automated tests
2. **Code Review**: Maintainers will review your code
3. **Feedback**: Address any requested changes
4. **Approval**: Once approved, your PR will be merged

### Reporting Issues

If you find a bug or want to suggest a feature:

1. **Check Existing Issues**: Search for similar issues first
2. **Create an Issue**: Use the appropriate template
   - Bug Report
   - Feature Request
   - Documentation Improvement
3. **Provide Details**:
   - Clear description
   - Steps to reproduce (for bugs)
   - Expected vs actual behavior
   - Environment information (OS, Node.js version, Python version)

### Getting Help

- **Documentation**: Check the [README.md](README.md) first
- **Issues**: Search existing [GitHub Issues](https://github.com/VishCarie28/scriptify-ai/issues)
- **Discussions**: Use GitHub Discussions for questions

## 📋 Development Workflow

```bash
# 1. Update your fork
git checkout main
git pull upstream main
git push origin main

# 2. Create feature branch
git checkout -b feature/my-feature

# 3. Make changes and commit
git add .
git commit -m "Add my feature"

# 4. Push to your fork
git push origin feature/my-feature

# 5. Create PR on GitHub
```

## 🎯 Areas for Contribution

We especially welcome contributions in:

- **Test Coverage**: Adding more test cases
- **Documentation**: Improving docs and examples
- **Bug Fixes**: Fixing reported issues
- **Features**: New functionality suggestions
- **Performance**: Optimizing code
- **UI/UX**: Improving the Chrome extension interface
- **CI/CD**: Enhancing Jenkins integration

## 📝 License

By contributing, you agree that your contributions will be licensed under the same license as the project (ISC License).

Thank you for contributing to Scriptify AI! 🎉

