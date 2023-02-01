const core = require('@actions/core');
const github = require('@actions/github');
const findUntestedFiles = require('./findUntestedFiles');

const octokit = (function getOctokit() {
  const token = core.getInput('token');
  return github.getOctokit(token);
})();

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function listChangedFiles() {
  core.debug('Fetching changed file names...')
  const pullNumber = github.context.payload.pull_request.number;
  const owner = github.context.repo.owner;
  const repo = github.context.repo.repo;
  let result = [];
  let hasNextPage = true;
  let cursor;
  const perPage = 100;

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
    const filePaths = filesResponseData.nodes.map(({ path }) => path);
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
