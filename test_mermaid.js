const https = require('https');
const fs = require('fs');

const testCases = [
    {
        name: "Simple English",
        code: `graph TD
    A[Start] --> B[End]`
    },
    {
        name: "Simple Chinese",
        code: `graph TD
    A[開始] --> B[結束]`
    },
    {
        name: "Real diagram from file",
        code: `graph TD
    A[交易監控輸出高風險事件] --> B[AML 分析人員手動蒐集資料]
    B --> C{資料是否完整}
    C -->|否| B
    C -->|是| D[分析人員撰寫 Excel 摘要]`
    }
];

function testMermaid(code, name) {
    const b64 = Buffer.from(code).toString('base64');
    const url = `https://mermaid.ink/img/${b64}`;

    console.log(`\\n=== Testing: ${name} ===`);
    console.log(`Code length: ${code.length} chars`);
    console.log(`Base64: ${b64.substring(0, 50)}...`);
    console.log(`URL: ${url.substring(0, 70)}...`);

    return new Promise((resolve) => {
        https.get(url, (response) => {
            console.log(`Status: ${response.statusCode}`);
            console.log(`Content-Type: ${response.headers['content-type']}`);
            console.log(`Content-Length: ${response.headers['content-length']}`);

            if (response.statusCode === 200) {
                const outputPath = `/tmp/test_mermaid_${name.replace(/\\s+/g, '_')}.jpg`;
                const file = fs.createWriteStream(outputPath);
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    const stats = fs.statSync(outputPath);
                    console.log(`✓ Saved to ${outputPath} (${stats.size} bytes)`);
                    resolve(true);
                });
            } else {
                console.log(`✗ Failed`);
                resolve(false);
            }
        }).on('error', (err) => {
            console.log(`✗ Error: ${err.message}`);
            resolve(false);
        });
    });
}

(async () => {
    for (const test of testCases) {
        await testMermaid(test.code, test.name);
        await new Promise(r => setTimeout(r, 1000)); // Rate limit
    }
})();
