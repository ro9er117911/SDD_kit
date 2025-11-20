const https = require('https');
const zlib = require('zlib');

const diagram = `graph TD
    A[交易監控輸出高風險事件] --> B[AML 分析人員手動蒐集資料]
    B --> C{資料是否完整}
    C -->|否| B
    C -->|是| D[分析人員撰寫 Excel 摘要]
    D --> E[Email 提交法遵審核]
    E --> F{主管審核}
    F -->|需補件| D
    F -->|核准| G[人工歸檔與報表]
    G --> H[結束]`;

function testPako(code) {
    const data = JSON.stringify({ code: code, mermaid: { theme: 'default' } });

    // Deflate
    const deflated = zlib.deflateSync(data, { level: 9 });

    // Base64 URL safe
    const b64 = deflated.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    const url = `https://mermaid.ink/img/pako:${b64}`;

    console.log('Testing Pako URL...');
    console.log('URL Length:', url.length);
    console.log('URL:', url);

    https.get(url, (res) => {
        console.log('Status:', res.statusCode);
        console.log('Content-Type:', res.headers['content-type']);
        console.log('Content-Length:', res.headers['content-length']);
    }).on('error', (e) => console.error(e));
}

testPako(diagram);
