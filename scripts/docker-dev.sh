#!/bin/sh
# Starts the development server inside Docker over HTTPS (Document 7, section 17.1). The certificate is made once
# with openssl in the "certificates" folder of your project (never committed). Your browser will warn about it the
# first time, because it was not made by a known authority: choose to continue, or trust certificates/localhost.pem
# once in your system. Nothing has to be installed on your machine.
set -e
mkdir -p certificates
if [ ! -f certificates/localhost.pem ] || [ ! -f certificates/localhost-key.pem ]; then
  openssl req -x509 -newkey rsa:2048 -nodes -days 365 -subj "/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,IP:127.0.0.1" \
    -keyout certificates/localhost-key.pem -out certificates/localhost.pem 2>/dev/null
  echo "Made a local HTTPS certificate in certificates/"
fi
exec npx next dev --hostname 0.0.0.0 --port 3001 --experimental-https \
  --experimental-https-key certificates/localhost-key.pem --experimental-https-cert certificates/localhost.pem
