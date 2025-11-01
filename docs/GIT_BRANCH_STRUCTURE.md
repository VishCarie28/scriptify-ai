# Git Branch Structure - Scriptify AI

## Current Branch Structure

```
main (local) ──────────────┐
                          │
                          └──> origin/main (remote on GitHub)
```

### Branch Details

**Main Branch (`main`)**
- **Purpose**: Primary development branch containing stable, production-ready code
- **Protected**: Should be protected on GitHub (recommended)
- **Status**: Currently active and synced with remote
- **Remote**: Tracks `origin/main`

**Remote Branch (`origin/main`)**
- **Location**: https://github.com/VishCarie28/scriptify-ai
- **Status**: Up-to-date with local main branch

## Branch Strategy

### For Contributors (External Contributors)

1. **Fork the Repository**
   ```
   GitHub UI: Click "Fork" button
   ```

2. **Clone Your Fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/scriptify-ai.git
   ```

3. **Set Up Remote Tracking**
   ```bash
   git remote add upstream https://github.com/VishCarie28/scriptify-ai.git
   ```

4. **Create Feature Branch**
   ```bash
   git checkout main
   git pull upstream main
   git checkout -b feature/your-feature-name
   ```

5. **Workflow**
   ```
   Your Fork (origin)          Upstream (VishCarie28)
        │                              │
   feature/xyz ────PR────> main <──── main
        │                              │
   (your fork)                    (original repo)
   ```

### Branch Naming Conventions

- `feature/` - New features (e.g., `feature/analytics-dashboard`)
- `bugfix/` or `fix/` - Bug fixes (e.g., `bugfix/login-issue`)
- `docs/` - Documentation updates (e.g., `docs/api-documentation`)
- `refactor/` - Code refactoring (e.g., `refactor/test-controller`)
- `test/` - Test additions (e.g., `test/integration-tests`)
- `chore/` - Maintenance tasks (e.g., `chore/update-dependencies`)

## Repository Setup for Contributions

### Step 1: Configure Repository Settings on GitHub

1. Go to **Settings** → **Branches**
2. Add branch protection rule for `main`:
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - ✅ Include administrators

3. Go to **Settings** → **General**
   - ✅ Allow forking
   - ✅ Allow contributions

### Step 2: Enable GitHub Features

1. **Pull Requests**
   - Templates enabled (already created)
   - Require linked issues (optional)

2. **Issues**
   - Issue templates enabled (already created)
   - Use issue templates for bug reports and feature requests

3. **Actions** (if using CI/CD)
   - Enable GitHub Actions workflows

### Step 3: Verify Contributor Workflow

Test that contributors can:

1. ✅ Fork the repository
2. ✅ Create branches in their fork
3. ✅ Open pull requests
4. ✅ PRs show proper templates
5. ✅ Issues can be created with templates

## Current Repository State

```bash
# View current branches
git branch -a

# View branch relationships
git log --oneline --graph --all --decorate -10

# Check remote configuration
git remote -v
```

## Contribution Workflow Diagram

```
Contributor                    Upstream Repository
     │                                │
     │  1. Fork                       │
     ├───────────────────────────────>│
     │                                │
     │  2. Clone fork                │
     │  git clone fork-url            │
     │                                │
     │  3. Create feature branch      │
     │  git checkout -b feature/xyz   │
     │                                │
     │  4. Make changes               │
     │  (edit files)                  │
     │                                │
     │  5. Commit & Push              │
     │  git push origin feature/xyz   │
     ├───────────────────────────────>│
     │                                │
     │  6. Open Pull Request        │
     │  (via GitHub UI)              │
     ├───────PR: feature/xyz─────────>│
     │                                │
     │                                │  7. Review
     │                                │     │
     │  8. Address feedback          │<────┘
     │  (make changes, push updates)  │
     │                                │
     │  9. Merge approved PR          │
     │<───────────────────────────────│
     │                                │
```

## Quick Reference Commands

### For Contributors

```bash
# Setup
git clone https://github.com/YOUR_USERNAME/scriptify-ai.git
cd scriptify-ai
git remote add upstream https://github.com/VishCarie28/scriptify-ai.git

# Create feature branch
git checkout main
git pull upstream main
git checkout -b feature/amazing-feature

# Make changes and commit
git add .
git commit -m "Add amazing feature"

# Push to your fork
git push origin feature/amazing-feature

# Keep your fork updated
git checkout main
git pull upstream main
git push origin main
```

### For Maintainers

```bash
# Review PRs
# (via GitHub UI)

# Merge PR
# (via GitHub UI - "Merge pull request" button)

# Or manually (if needed)
git checkout main
git pull origin main
git merge feature/branch-name
git push origin main
```

## Branch Protection Best Practices

1. **Protect Main Branch**
   - Prevent direct pushes to main
   - Require PR reviews
   - Require passing CI checks

2. **Clear Contribution Guidelines**
   - CONTRIBUTING.md (already added)
   - Pull request template (already added)
   - Issue templates (already added)

3. **Regular Maintenance**
   - Delete merged branches
   - Keep main branch clean
   - Regular releases/tags

## Current Commit History (Last 5)

```bash
git log --oneline --graph -5
```

This document will be updated as the repository structure evolves.

