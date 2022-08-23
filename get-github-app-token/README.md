# get-github-app-token

This action helps you to authenticate as a Github App, and obtain an access token.

## Usage

```yaml
steps:
  - uses: iCHEF/github-actions/get-app-token@main
    with:
      app-id: (Github App ID)
      private-key: (Private Key)
      installation-account: iCHEF
```
