async function test() {
  try {
    const res = await fetch('http://127.0.0.1:5000/api/run-agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customCode: 'a friend of mine tested it and i suck lol',
        language: 'Auto'
      })
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err);
  }
}

test();
