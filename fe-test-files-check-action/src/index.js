const core = require('@actions/core');
const github = require('@actions/github');
const findUntestedFiles = require('./findUntestedFiles');

const octokit = (function getOctokit() {
  const token = core.getInput('token');
  return github.getOctokit(token);
})();

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// See https://docs.github.com/en/graphql/reference/enums#patchstatus
const PATCH_STATUS = {
  ADDED: 'ADDED',
  CHANGED: 'CHANGED',
  COPIED: 'COPIED',
  DELETED: 'DELETED',
  MODIFIED: 'MODIFIED',
  RENAMED: 'RENAMED',
};

async function listChangedFiles() {
  core.debug('Fetching changed file names...')
  const pullNumber = github.context.payload.pull_request.number;
  const owner = github.context.repo.owner;
  const repo = github.context.repo.repo;
  let result = [];
  let hasNextPage = true;
  let cursor;
  /**
   * For rate limit, we can't fetch too many records at a time.
   *
   * Detail see:
   * https://docs.github.com/en/graphql/overview/resource-limitations#node-limit
   */
  const perPage = 20;

  while(hasNextPage) {
    const params = {
      owner,
      name: repo,
      number: pullNumber,
      first: perPage,
      cursor,
    };

    /**
     * Can find out this gql in https://docs.github.com/en/graphql/overview/explorer
     */
    const { repository } = await octokit.graphql(
      `query getPullRequestChangedFiles($name: String!, $owner: String!, $number: Int!, $first: Int, $cursor: String) {
        repository(name: $name, owner: $owner) {
          pullRequest(number: $number) {
            files(first: $first, after: $cursor) {
              nodes {
                path
                changeType
              }
              pageInfo {
                endCursor
                hasNextPage
              }
            }
          }
        }
      }`,
      params
    );

    const filesResponseData = repository.pullRequest.files;

    core.debug('get response data: ', repository)
    core.debug('with params:', params);
    /**
     * Deleted files don't count.
     */
    const filePaths = filesResponseData.nodes
      .filter(({ changeType }) => ![PATCH_STATUS.DELETED].includes(changeType))
      .map(({ path }) => path);
    result = result.concat(filePaths);
    const { pageInfo } = filesResponseData;
    cursor = pageInfo.endCursor;
    hasNextPage = pageInfo.hasNextPage;

    /**
     * For Rate limit, see https://docs.github.com/en/graphql/overview/resource-limitations
     */
    if (hasNextPage) {
      await delay(3000);
    }
  }

  return result;
}

/**
 * The entrypoint for checking changed files in PR has test.
 *
 * Generally there are two steps:
 * - Fetch changed file names in PR through github api.
 * - Check if these files has corresponding tests, if one of them has no test this action would fail.
 */
async function checkAllChangedFilesHasTest() {
  const testScopes = core.getInput('testScopes').split(',').map(s => s.trim());
  console.log('testScopes', testScopes)
  const filePaths = await listChangedFiles();
  console.log('get changed files: \n', filePaths.join('\n'));
  const untestedFiles = await findUntestedFiles({
    filePaths,
    testScopes,
    allowTodo: core.getInput('allowTodo'),
  });

  if (untestedFiles.length > 0) {
    core.setFailed(`Untested files found, please add test for following files:
      ${untestedFiles.join('\n')}
    `)
  }

  console.info('All files are tested.');
}

checkAllChangedFilesHasTest();
