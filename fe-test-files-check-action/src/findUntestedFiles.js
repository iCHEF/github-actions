const fs = require('fs/promises');
const minimatch = require('minimatch');
const path = require('path');

function getFilenamesInTestScope(fileGlob, filenames) {
  return filenames.filter(filename => minimatch(filename, fileGlob));
}

async function checkHasTestInTestFile(testFileFullname, allowTodo) {
  try {
    testFileContent = (await fs.readFile(testFileFullname, { encoding: 'utf-8' }));
  } catch (error) {
    console.log(error);
    console.log('Test file not exists for', testFileFullname);
    return false;
  }

  if (env.RUNNER_DEBUG) {
    console.log('test file content', testFileContent)
  }

  /**
   * TODO: reimplement this by checking AST
   */
  const hasTest = [
    'it(',
    'it.each(',
    'test(',
    'test.each(',
  ].some(value => fileContent.includes(value));

  if (!allowTodo) {
    return hasTest;
  }

  const hasTodo = ['it.todo(', 'test.todo('].some(value => fileContent.includes(value))

  return hasTest || hasTodo;
}

async function hasSkipCommentInSourceFile(sourceFileFullname) {
  const sourceFileContent = (await fs.readFile(sourceFileFullname, { encoding: 'utf-8' }));
  return sourceFileContent.includes('istanbul ignore file');
}

async function hasTestForSourceFile(sourceFilename, allowTodo) {
  console.log(`checking if ${sourceFilename} has related test file...`);
  if (!sourceFilename.includes('.js') || sourceFilename.includes('.test.js')) {
    return true;
  }

  const env = process.env;
  const sourceFileDir = `${env.GITHUB_WORKSPACE}/${path.dirname(sourceFilename)}`;
  const testDir = `${sourceFileDir}/__tests__`;
  const sourceFilenameWithoutExt = path.parse(sourceFilename).name;
  const testFileFullname = `${testDir}/${sourceFilenameWithoutExt}.test.js`;
  console.log('Full test filename : ', testFileFullname);

  if (await checkHasTestInTestFile(testFileFullname, allowTodo)) {
    return true;
  }

  const sourceFileFullname = `${env.GITHUB_WORKSPACE}/${sourceFilename}`;
  if (hasSkipCommentInSourceFile(sourceFileFullname)) {
    console.log(`${sourceFilename} contains skip test comment, regard it as tested.`);
    return true;
  }

  return false;
}

async function findUntestedFiles({ filePaths, testScopes, allowTodo }) {
  const results = await Promise.all(testScopes.map(
    async testScope => {
      const filenamesInTestScope = getFilenamesInTestScope(testScope, filePaths);
      console.log('matching testScope:', testScope, 'matched files:\n' , filenamesInTestScope.join('\n'));
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
