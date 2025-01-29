import fs from 'fs';
import path from 'path';
import colors from 'colors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Stream untuk menulis log ke file
const logStream = fs.createWriteStream(path.join(logDir, 'app.log'), {
  flags: 'a',
});
const errorStream = fs.createWriteStream(path.join(logDir, 'error.log'), {
  flags: 'a',
});

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

function logToFile(stream, level, message) {
  const logEntry = `[${getTimestamp()}] [${level.toUpperCase()}] ${message}\n`;
  stream.write(logEntry);
}

const logger = {
  debug: function (...args) {
    const message = args
      .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : arg))
      .join(' ');
    const prefix = `[${getTimestamp()}] [DEBUG]`.debug;
    console.log(prefix, ...args);
    logToFile(logStream, 'debug', message);
  },

  info: function (...args) {
    const message = args
      .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : arg))
      .join(' ');
    const prefix = `[${getTimestamp()}] [INFO]`.info;
    console.info(prefix, ...args);
    logToFile(logStream, 'info', message);
  },

  warn: function (...args) {
    const message = args
      .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : arg))
      .join(' ');
    const prefix = `[${getTimestamp()}] [WARN]`.warn;
    console.warn(prefix, ...args);
    logToFile(logStream, 'warn', message);
    logToFile(errorStream, 'warn', message);
  },

  error: function (...args) {
    const message = args
      .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : arg))
      .join(' ');
    const prefix = `[${getTimestamp()}] [ERROR]`.error;
    console.error(prefix, ...args);
    logToFile(logStream, 'error', message);
    logToFile(errorStream, 'error', message);
  },
};

export default logger;
