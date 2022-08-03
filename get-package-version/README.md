# get-package-version

Read `version` field from `package.json` in current working directory.

## Usage

``` yml
steps:
  - id: get-version
    uses: iCHEF/github-actions/get-package-version@main
  - run: echo "${{ steps.get-version.outputs.version }}"
```
