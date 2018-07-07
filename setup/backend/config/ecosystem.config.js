module.exports = {
  apps: [
    {
      name: 'laborx.profile.backend',
      script: 'bin/www',
      watch: false,
      env: {
        PORT: 3000,
        NODE_ENV: 'production',
        DEBUG: '@laborx/profile.backend:*',
        DEBUG_COLORS: true
      }
    }
  ]
}
