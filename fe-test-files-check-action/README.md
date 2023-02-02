# FE test files check action

Check if every changed JS file in Pull Request has a corresponding test.

## Usage

In repo github workflow:

```yaml
steps:
  # checkout project repo
  - uses: actions/checkout@v3
  # checkout this action
  - uses: actions/checkout@v3
    with:
      repository: iCHEF/github-actions
      path: ./.github/github-actions
  - name: Check untested files
    uses: ./.github/github-actions/fe-test-files-check-action
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
