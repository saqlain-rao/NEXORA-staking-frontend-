rm -rf node_modules package-lock.json && npm cache clean --force && npm install --no-audit --no-fund --legacy-peer-deps > install.log 2>&1 && npm run dev > dev.log 2>&1
