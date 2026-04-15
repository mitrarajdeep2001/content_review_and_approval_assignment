module.exports = {
  apps: [
    {
      name: 'contentflow',
      script: 'npx',
      args: 'vite preview --port 3000 --host 0.0.0.0',
      cwd: '/home/user/webapp',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork'
    }
  ]
}
