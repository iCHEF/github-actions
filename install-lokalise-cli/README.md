# install-lokalise-cli

This action helps lock Lokalise CLI installation to a specified version.

When you specifiy version `v2.6.8`, this action will use the install script from tag `v2.6.8` and ask to install the `v2.6.8` binary.

## Usage

```yaml
steps:
  - uses: iCHEF/github-actions/install-lokalise-cli@main
    with:
      version: v2.6.8
  - name: run Lokalise command
    run: lokalise2 --help
```

## Inputs

| input | desc |
| ----- | ---- |
| `version`\* | **Required.**<br>Lokalise CLI version tag, including the `v` prefix. Check out their [release page] for tags list. |


[release page]: https://github.com/lokalise/lokalise-cli-2-go/releases