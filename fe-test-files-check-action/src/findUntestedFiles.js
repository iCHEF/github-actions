const fs = require('fs/promises');
const minimatch = require('minimatch');
const path = require('path');
const core = require('@actions/core');

const FILE_NAME_KEYWORDS_NOT_REQUIRING_TESTS = [
  '.test.js',
  '.tape.js',
  '.d.ts',
  'types.ts',
  'fixture',
  'index',
  'constant',
  '/types/',
  'test.ts',
];

const TEST_CASE_KEYWORDS = [
  'it(',
  'it.each',
  'test(',
  'test.each',
  // Temporary fix for skipping hook call assertion utils in fe-test-utils.
  'expectToBe',
]

const TODO_TEST_CASE_KEYWORDS = [
  'it.todo(',
  'test.todo(',
];

function getFilenamesInTestScope(fileGlob, filenames) {
  return filenames.filter(filename => minimatch(filename, fileGlob));
}

/**
 * Get test file content for given full name of source file.
 * We'll take related `__tests__` folder and try to open both `.test.js` & `.test.jsx` file,
 * return file content if anyone exists.
 * Throw error on both test files not found.
 */
async function getTestFileContent(sourceFileFullname) {
  const testFileDir = `${path.dirname(sourceFileFullname)}/__tests__`;
  const sourceFilenameWithoutExt = path.parse(sourceFileFullname).name;
  const possibleTestFilename = [
    `${sourceFilenameWithoutExt}.test.js`,
    `${sourceFilenameWithoutExt}.test.jsx`,
    `${sourceFilenameWithoutExt}.test.ts`,
    `${sourceFilenameWithoutExt}.test.tsx`,
  ];
  const possibleTestFileFullNames = possibleTestFilename.map(
    testFileName => `${testFileDir}/${testFileName}`
  );

  for (testFileFullname of possibleTestFileFullNames) {
    try {
      const content = await fs.readFile(testFileFullname, { encoding: 'utf-8' });
      return content;
    } catch (error) {
      core.debug(error);
    }
  }

  throw new Error(`Test file not exists for ${sourceFileFullname}`);
}

async function checkHasTestInRelatedTestFile(sourceFileFullname, allowTodo) {
  let testFileContent;
  try {
    testFileContent = await getTestFileContent(sourceFileFullname);
  } catch (error) {
    core.debug(error);
    return false;
  }

  core.debug('test file content', testFileContent)

  /**
   * TODO: reimplement this by checking AST
   */
  const hasTest = TEST_CASE_KEYWORDS.some(value => testFileContent.includes(value));

  if (!allowTodo) {
    return hasTest;
  }

  const hasTodo = TODO_TEST_CASE_KEYWORDS.some(value => testFileContent.includes(value))

  return hasTest || hasTodo;
}

async function hasSkipCommentInSourceFile(sourceFileFullname) {
  const sourceFileContent = (await fs.readFile(sourceFileFullname, { encoding: 'utf-8' }));
  return sourceFileContent.includes('istanbul ignore file');
}

async function hasTestForSourceFile(sourceFilename, allowTodo) {
  core.debug(`checking if ${sourceFilename} has related test file...`);
  if (
    (['.js', '.ts'].every(ext => !sourceFilename.includes(ext)))
    || FILE_NAME_KEYWORDS_NOT_REQUIRING_TESTS.some(value => sourceFilename.includes(value))
  ) {
    return true;
  }

  const sourceFileFullname = `${process.env.GITHUB_WORKSPACE}/${sourceFilename}`;

  if (await checkHasTestInRelatedTestFile(sourceFileFullname, allowTodo)) {
    return true;
  }

  if (await hasSkipCommentInSourceFile(sourceFileFullname)) {
    core.debug(`${sourceFilename} contains skip test comment, regard it as tested.`);
    return true;
  }

  return false;
}

async function findUntestedFiles({ filePaths, testScopes, allowTodo }) {
  const results = await Promise.all(testScopes.map(
    async testScope => {
      const filenamesInTestScope = getFilenamesInTestScope(testScope, filePaths);
      core.debug('matching testScope:', testScope, 'matched files:\n' , filenamesInTestScope.join('\n'));
      return (await Promise.all(
        filenamesInTestScope.map(async (filename) => {
          const hasTest = await hasTestForSourceFile(filename, allowTodo)
          return hasTest ? '' : filename;
        })
      )).filter(untestedFilename => !!untestedFilename);
    }
  ))

  return results.reduce(
    (all, untestedFilenames) => [...all, ...untestedFilenames],
    []
  );
}

module.exports = findUntestedFiles;
