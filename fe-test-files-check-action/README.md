# FE test files check action

Check if every changed JS file in Pull Request has a corresponding test.

## Usage

In repo github workflow:

```yaml
steps:
  # checkout project repo
  - uses: actions/checkout@v3
  - uses: iCHEF/github-actions/fe-test-files-check-action@main
    with:
      token: ${{ secrets.GITHUB_TOKEN }}
      # list files should have corresponding tests with glob
      testScopes: src/shared/**/*, src/hq/shared/**/*
      # regard file as tested if test file contains `it.todo()`. default is disallowed.
      allowTodo: |
        ${{ !startsWith(github.event.pull_request.base.ref, 'release/')
          && !startsWith(github.event.pull_request.base.ref, 'project/')
          && github.event.pull_request.base.ref != 'develop'
          && github.event.pull_request.base.ref != 'master' }}
```

## Inputs

| input | desc |
| ----- | ---- |
| `testScopes`\* | **Required** a comma separated string containing file globs, for matching source files which should has test. |
| `token`\* | **Required** Github Token for accessing github api. |
| `allowTodo` | When `allowTodo=true`, regard the source file as tested if there is `it.todo()` in test file. Default is `false` |

## Outputs

None. But action will fail if there's any file matching testScope without test.

## Development

### Building the Action

Before releasing a new version of this action, you need to build the action to generate the `dist` directory:

```bash
# Clean previous build
yarn clean:build

# Build the action
yarn build
```

The build process uses [@vercel/ncc](https://github.com/vercel/ncc) to compile the code and its dependencies into a single file that can be used by GitHub Actions.

### Release Process

1. Make your changes to the source code in the `src` directory
2. Build the action using the commands above
3. Commit both your source changes and the generated `dist` directory

**Important**: Always build and commit the `dist` directory before creating a new release. GitHub Actions will use the compiled code in the `dist` directory, not the source code.
