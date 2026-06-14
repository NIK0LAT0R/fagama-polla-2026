
module.exports = async function () {
  return {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify([
      { ok: true, source: 'azure-functions' }
    ])
  };
};
