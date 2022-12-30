# check-asana-tasks-created

Check Asana task has been created and mentioned in PR description.

## Usage

``` yml
steps:
  - name: Check asana task
    id: asana
    uses: iCHEF/github-actions/check-asana-task-created@main
    with:
      pr-description: ${{ github.event.pull_request.body }}
  - name: Asana task not found
    if: steps.asana.outputs.created == 'false'
    run: |
      echo "Asana task not found."
```
