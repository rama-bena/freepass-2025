import colors from 'colors';

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
    const prefix = `[${getTimestamp()}] [DEBUG]`.debug;
    console.log(prefix, ...args);
  },

  info: function (...args) {
    const prefix = `[${getTimestamp()}] [INFO]`.info;
    console.info(prefix, ...args);
  },

  warn: function (...args) {
    const prefix = `[${getTimestamp()}] [WARN]`.warn;
    console.warn(prefix, ...args);
  },

  error: function (...args) {
    const prefix = `[${getTimestamp()}] [ERROR]`.error;
    console.error(prefix, ...args);
  },
};

export default logger;
