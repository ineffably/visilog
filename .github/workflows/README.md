# GitHub Actions Workflows

This directory contains automated workflows for continuous integration, deployment, and maintenance of the websocket-logger project.

## 🔄 Workflows Overview

### 1. **CI Workflow** (`ci.yml`)
**Triggers:** Push to `main`/`develop`, Pull Requests
**Purpose:** Continuous Integration validation

- **Multi-Node Testing:** Tests on Node.js 18.x, 20.x, and 22.x
- **Comprehensive Validation:**
  - Linting with ESLint
  - TypeScript type checking
  - Full test suite execution
  - Coverage reporting
  - Build validation
  - Package integrity checks
- **Coverage Upload:** Integrates with Codecov for coverage tracking

### 2. **Release Workflow** (`release.yml`)
**Triggers:** Manual dispatch, Version tags (`v*`)
**Purpose:** Automated versioning, building, and publishing

- **Version Management:**
  - Manual version bumping (patch, minor, major, prerelease)
  - Automatic tag creation and GitHub releases
  - Semantic versioning support
- **Publishing Pipeline:**
  - Full test suite validation
  - Build artifact verification
  - NPM publishing with access control
  - Post-publish validation
- **Release Notes:** Auto-generated with build information

### 3. **PR Validation** (`pr-validation.yml`)
**Triggers:** Pull Request events
**Purpose:** Enhanced PR validation and feedback

- **Comprehensive Checks:**
  - Security vulnerability scanning
  - Auto-fix linting issues
  - Bundle size analysis
  - Integration testing
- **Automated Feedback:** Comments on PRs with validation results
- **Security Integration:** Trivy vulnerability scanning with SARIF upload

### 4. **Maintenance Workflow** (`maintenance.yml`)
**Triggers:** Weekly schedule, Manual dispatch
**Purpose:** Automated maintenance and dependency management

- **Dependency Updates:** Weekly automated dependency updates
- **Security Auditing:** Regular security vulnerability checks
- **Cleanup:** Automatic cleanup of old workflow runs

## 🚀 Getting Started

### Required Secrets

To use these workflows, configure the following secrets in your GitHub repository:

1. **`NPM_TOKEN`** - NPM authentication token for publishing
   ```bash
   # Create NPM token at https://www.npmjs.com/settings/tokens
   # Add as repository secret: Settings > Secrets > Actions > New repository secret
   ```

2. **`GITHUB_TOKEN`** - Automatically provided by GitHub Actions (no setup needed)

### NPM Token Setup

1. Go to [NPM Access Tokens](https://www.npmjs.com/settings/tokens)
2. Click "Generate New Token"
3. Select "Automation" type
4. Copy the token
5. In GitHub: Repository Settings > Secrets and variables > Actions > New repository secret
6. Name: `NPM_TOKEN`, Value: your token

## 📋 Workflow Usage

### Manual Release Process

1. **Navigate to Actions tab** in your GitHub repository
2. **Select "Release" workflow**
3. **Click "Run workflow"**
4. **Choose version type:**
   - `patch` - Bug fixes (1.0.0 → 1.0.1)
   - `minor` - New features (1.0.0 → 1.1.0)
   - `major` - Breaking changes (1.0.0 → 2.0.0)
   - `prerelease` - Pre-release versions (1.0.0 → 1.0.1-alpha.0)

### Automatic Triggers

- **CI runs** on every push and PR
- **PR validation** provides detailed feedback on pull requests
- **Maintenance** runs weekly for dependency updates
- **Release** can be triggered by pushing version tags

## 🔧 Customization

### Modifying Node.js Versions

Edit the matrix in `ci.yml`:
```yaml
strategy:
  matrix:
    node-version: [18.x, 20.x, 22.x]  # Add/remove versions as needed
```

### Changing Coverage Thresholds

Update `jest.config.js` coverage thresholds:
```javascript
coverageThreshold: {
  global: {
    statements: 80,  // Adjust as needed
    branches: 80,
    functions: 80,
    lines: 80
  }
}
```

### Customizing Release Notes

Modify the release body in `release.yml`:
```yaml
body: |
  ## Changes in v${{ env.NEW_VERSION }}
  # Add your custom release notes template here
```

## 🛡️ Security Features

- **Vulnerability Scanning:** Trivy security scanner
- **Dependency Auditing:** NPM audit integration
- **SARIF Upload:** Security findings in GitHub Security tab
- **Token Security:** Secure handling of NPM and GitHub tokens

## 📊 Monitoring

- **Coverage Reports:** Integrated with Codecov
- **Build Status:** Visible in repository badges
- **Security Alerts:** GitHub Security tab integration
- **Workflow Status:** Actions tab provides detailed logs

## 🔍 Troubleshooting

### Common Issues

1. **NPM Publish Fails**
   - Verify NPM_TOKEN is correctly set
   - Check package name availability
   - Ensure version hasn't been published already

2. **Tests Fail in CI**
   - Check Node.js version compatibility
   - Verify all dependencies are properly declared
   - Review test environment differences

3. **Build Artifacts Missing**
   - Ensure build script runs successfully
   - Check Rollup configuration
   - Verify TypeScript compilation

### Debug Mode

Enable debug logging by setting repository variable:
- Name: `ACTIONS_STEP_DEBUG`
- Value: `true`

## 📈 Best Practices

1. **Always test locally** before pushing
2. **Use semantic versioning** for releases
3. **Review PR validation** comments before merging
4. **Monitor security alerts** regularly
5. **Keep dependencies updated** via maintenance workflow

---

For more information about GitHub Actions, visit the [official documentation](https://docs.github.com/en/actions). 