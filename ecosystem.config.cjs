module.exports = {
  apps: [
    {
      name: 'concert-contract-agent',
      script: 'npx',
      args: 'wrangler pages dev dist --ip 0.0.0.0 --port 3000',
      env: {
        NODE_ENV: 'development',
        GENSPARK_TOKEN: process.env.GENSPARK_TOKEN
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork'
    }
  ]
}
