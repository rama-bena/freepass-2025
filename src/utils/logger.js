import colors from 'colors';

const isTestEnv = process.env.NODE_ENV === 'test';
const isProdEnv = process.env.NODE_ENV === 'production';

colors.setTheme({
  debug: 'cyan',
  info: 'green',
  warn: 'yellow',
  error: 'red',
  timestamp: 'gray',
});

function getTimestamp() {
  return new Date().toISOString();
}

const logger = {
  debug: function (...args) {
    if (isTestEnv || isProdEnv) return;
    const prefix = `[${getTimestamp()}] [DEBUG]`.debug;
    console.log(prefix, ...args);
  },

  info: function (...args) {
    if (isTestEnv) return;
    const prefix = `[${getTimestamp()}] [INFO]`.info;
    console.info(prefix, ...args);
  },

  warn: function (...args) {
    if (isTestEnv) return;
    const prefix = `[${getTimestamp()}] [WARN]`.warn;
    console.warn(prefix, ...args);
  },

  error: function (...args) {
    if (isTestEnv) return;
    const prefix = `[${getTimestamp()}] [ERROR]`.error;
    console.error(prefix, ...args);
  },
};

export default logger;
