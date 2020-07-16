async function ajaxCall(endpoint, method, payload) {
  const headers = {
    'Content-Type': 'application/json',
  };

  const data = {
    method,
    mode: 'cors',
    headers,
    body: method !== 'GET' ? JSON.stringify(payload) : null,
  };
  const request = new Request(endpoint, data);
  try {
    const res = await fetch(request);
    return res.json();
  } catch (error) {
    throw new Error(error);
  }
}

export default ajaxCall;
