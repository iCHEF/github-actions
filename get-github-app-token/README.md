# get-github-app-token

This action helps you to authenticate as a Github App, and obtain an access token.

## Usage

```yaml
steps:
  - id: get-token
    uses: iCHEF/github-actions/get-app-token@main
    with:
      app-id: (Github App ID)
      private-key: (Private Key)
      installation-account: iCHEF
  - name: run Github command
    with:
      GITHUB_TOKEN: ${{ steps.get-token.outputs.token }}
    run: gh api
```

## Inputs

`*` marks **required** inputs

| input | desc |
| ----- | ---- |
| `app-id`\* | **Required.**<br>Github App ID. |
| `private-key`\* | **Required.**<br>Github App Private Key for signing JWT tokens. |
| `installation-account`\* | **Required.**<br>Account name which your App has been installed to. Used for finding correct installation and then generate access tokens. |

## Outputs

| output | desc |
| ------ | ---- |
| `token` |  Github access token authenticated as your Github App. |
