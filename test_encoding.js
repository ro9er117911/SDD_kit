const https = require('https');

// Test if padding or URL encoding is the issue
const testCases = [
    {
        name: "With curly braces",
        code: `graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[End]`
    },
    {
        name: "With pipes and Chinese",
        code: `graph TD
    A[數據] -->|是| B[處理]
    A -->|否| C[結束]`
    }
];

function testWithEncoding(code, name) {
    const b64 = Buffer.from(code).toString('base64');
    // Try URL-safe base64
    const urlSafeB64 = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

    console.log(`\\n=== ${name} ===`);
    console.log(`Original B64: ${b64}`);
    console.log(`URL-safe B64: ${urlSafeB64}`);

    const urls = [
        { type: "Standard", url: `https://mermaid.ink/img/${b64}` },
        { type: "URL-safe", url: `https://mermaid.ink/img/${urlSafeB64}` },
        { type: "URL-encoded", url: `https://mermaid.ink/img/${encodeURIComponent(b64)}` }
    ];

    urls.forEach(({ type, url }) => {
        https.get(url, (response) => {
            console.log(`${type}: ${response.statusCode} - ${url.substring(0, 60)}...`);
        }).on('error', (err) => {
            console.log(`${type}: Error - ${err.message}`);
        });
    });
}

testCases.forEach((test, i) => {
    setTimeout(() => testWithEncoding(test.code, test.name), i * 2000);
});
