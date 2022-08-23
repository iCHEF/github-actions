const core = require('@actions/core');
/** @type {import('node-fetch').default} */
const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');

const getJwtToken = ({ appId, privateKey }) => {
  const timestamp = Math.floor((new Date()).getTime() / 1000);
  const payload = {
    iat: timestamp - 60,
    exp: timestamp + (60 * 10),
    iss: appId,
  };

  const jwtToken = jwt.sign(
    payload,
    privateKey,
    { algorithm: 'RS256' }
  );

  return jwtToken;
};

const getAccessToken = async ({ jwtToken, account }) => {
  const headers = {
    authorization: `Bearer ${jwtToken}`,
    accept: 'application/vnd.github.v3+json',
  };
  const ENDPOINT = 'https://api.github.com/app/installations';

  const installationsList = await fetch(ENDPOINT, { headers })
    .then(res => res.json());

  const ichefInstallation = installationsList.find(
    installation => (installation.account.login === account)
  );

  const requestTokenPayload = await fetch(
    `${ENDPOINT}/${ichefInstallation.id}/access_tokens`,
    {
      method: 'POST',
      headers,
    }
  ).then(res => res.json());

  return requestTokenPayload?.token;
};

(async () => {
  try {
    const jwtToken = getJwtToken({
      privateKey: core.getInput('private-key'),
      appId: core.getInput('app-id'),
    });

    const accessToken = await getAccessToken({
      jwtToken,
      account: core.getInput('installation-account'),
    });

    core.setOutput('token', accessToken);
  } catch (error) {
    core.setFailed(error.message);
  }
})();
