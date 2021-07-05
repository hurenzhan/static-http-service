const config = {
  'port': {
    option: '-p,--port <n>',
    description: 'set server port',
    default: 8080,
    usage: 'hs -p 8080'
  },
  'directory': {
    option: '-d,--directory <n>',
    description: 'set server directory',
    default: process.cwd(),
    usage: 'hs -d D:\\demo'
  }
};


module.exports = config;