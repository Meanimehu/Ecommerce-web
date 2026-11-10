// Test-only HTTPS in front of the production server, so end-to-end tests run over HTTPS like staging and production
// (Document 7, section 17.1). https://localhost:3001 -> http://127.0.0.1:3002. A throwaway self-signed certificate is
// made with openssl on first use (never committed); only the test browser is told to accept it.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import http from 'node:http';
import https from 'node:https';

const dir = '.certificates-test';
const key = `${dir}/localhost-key.pem`;
const cert = `${dir}/localhost.pem`;
if (!existsSync(key) || !existsSync(cert)) {
  mkdirSync(dir, { recursive: true });
  execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '30', '-subj', '/CN=localhost', '-addext', 'subjectAltName=DNS:localhost', '-keyout', key, '-out', cert], { stdio: 'ignore' });
}

const port = Number(process.env.FRONT_PORT ?? 3001);
const target = Number(process.env.TARGET_PORT ?? 3002);

https
  .createServer({ key: readFileSync(key), cert: readFileSync(cert) }, (req, res) => {
    const upstream = http.request(
      { host: '127.0.0.1', port: target, method: req.method, path: req.url, headers: { ...req.headers, 'x-forwarded-proto': 'https', 'x-forwarded-host': req.headers.host } },
      (answer) => {
        res.writeHead(answer.statusCode ?? 502, answer.headers);
        answer.pipe(res);
      },
    );
    upstream.on('error', () => {
      res.writeHead(502);
      res.end();
    });
    req.pipe(upstream);
  })
  .listen(port, () => console.log(`https://localhost:${port} -> http://127.0.0.1:${target}`));
