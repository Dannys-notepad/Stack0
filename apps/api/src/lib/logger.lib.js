const logger = () => {
  const log = (level, message, meta = null) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    console.log(logMessage, `\n`);
    if (meta) {
      console.log(meta);
    }
  };

  return {
    info: (message, meta) => log('info', message, meta),
    error: (message, meta) => log('error', message, meta),
    warn: (message, meta) => log('warn', message, meta)
  };
};

export default logger;