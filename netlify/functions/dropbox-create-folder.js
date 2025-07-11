const { Dropbox } = require('dropbox');

exports.handler = async function(event) {
  try {
    const { path } = JSON.parse(event.body || '{}');
    if (!path) {
      return { statusCode: 400, body: 'Неверные параметры' };
    }
    const dbx = new Dropbox({ accessToken: process.env.DROPBOX_TOKEN });
    await dbx.filesCreateFolderV2({ path });
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
}; 