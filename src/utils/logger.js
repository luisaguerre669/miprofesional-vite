// Logger Utility for MiProfesional Backend

const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'info';
    this.logFile = process.env.LOG_FILE || 'logs/app.log';
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
    
    // Ensure logs directory exists
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  shouldLog(level) {
    return this.levels[level] <= this.levels[this.logLevel];
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaString = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaString}`;
  }

  writeToFile(formattedMessage) {
    try {
      fs.appendFileSync(this.logFile, formattedMessage + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  error(message, meta = {}) {
    const formattedMessage = this.formatMessage('error', message, meta);
    console.error(formattedMessage);
    this.writeToFile(formattedMessage);
  }

  warn(message, meta = {}) {
    if (this.shouldLog('warn')) {
      const formattedMessage = this.formatMessage('warn', message, meta);
      console.warn(formattedMessage);
      this.writeToFile(formattedMessage);
    }
  }

  info(message, meta = {}) {
    if (this.shouldLog('info')) {
      const formattedMessage = this.formatMessage('info', message, meta);
      console.log(formattedMessage);
      this.writeToFile(formattedMessage);
    }
  }

  debug(message, meta = {}) {
    if (this.shouldLog('debug')) {
      const formattedMessage = this.formatMessage('debug', message, meta);
      console.log(formattedMessage);
      this.writeToFile(formattedMessage);
    }
  }

  // Request logging middleware helper
  logRequest(req, res, next) {
    const start = Date.now();
    const { method, url, ip, headers } = req;
    
    // Log request
    this.info('Request started', {
      method,
      url,
      ip,
      userAgent: headers['user-agent'],
      timestamp: new Date().toISOString()
    });

    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function(chunk, encoding) {
      const duration = Date.now() - start;
      const { statusCode } = res;
      
      // Log response
      if (statusCode >= 400) {
        logger.error('Request completed with error', {
          method,
          url,
          statusCode,
          duration: `${duration}ms`,
          ip
        });
      } else {
        logger.info('Request completed', {
          method,
          url,
          statusCode,
          duration: `${duration}ms`,
          ip
        });
      }
      
      originalEnd.call(this, chunk, encoding);
    };

    next();
  }

  // Error logging middleware helper
  logError(error, req, res, next) {
    const { method, url, ip, headers } = req;
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    
    this.error('Unhandled error', {
      method,
      url,
      ip,
      statusCode,
      message,
      stack: error.stack,
      userAgent: headers['user-agent'],
      timestamp: new Date().toISOString()
    });

    // Send error response
    res.status(statusCode).json({
      success: false,
      error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : message,
      message: 'An error occurred while processing your request',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }

  // Database operation logging
  logDbOperation(operation, collection, query = {}, result = null) {
    this.debug('Database operation', {
      operation,
      collection,
      query: JSON.stringify(query),
      resultCount: Array.isArray(result) ? result.length : result ? 1 : 0,
      timestamp: new Date().toISOString()
    });
  }

  // Authentication logging
  logAuth(action, userId, ip, success = true, error = null) {
    const logData = {
      action,
      userId,
      ip,
      success,
      timestamp: new Date().toISOString()
    };

    if (error) {
      logData.error = error.message;
    }

    if (success) {
      this.info('Authentication success', logData);
    } else {
      this.warn('Authentication failure', logData);
    }
  }

  // Business logic logging
  logBooking(action, bookingId, userId, professionalId, data = {}) {
    this.info(`Booking ${action}`, {
      action,
      bookingId,
      userId,
      professionalId,
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  logPayment(action, paymentId, userId, amount, status, data = {}) {
    this.info(`Payment ${action}`, {
      action,
      paymentId,
      userId,
      amount,
      status,
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  logNotification(type, recipient, subject, data = {}) {
    this.info(`Notification sent`, {
      type,
      recipient,
      subject,
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  // Performance monitoring
  logPerformance(operation, duration, metadata = {}) {
    const level = duration > 1000 ? 'warn' : 'info';
    
    this[level]('Performance metric', {
      operation,
      duration: `${duration}ms`,
      ...metadata,
      timestamp: new Date().toISOString()
    });
  }

  // Security logging
  logSecurity(event, details = {}) {
    this.warn(`Security event: ${event}`, {
      event,
      ...details,
      timestamp: new Date().toISOString()
    });
  }

  // System health logging
  logHealth(component, status, details = {}) {
    const level = status === 'healthy' ? 'info' : 'error';
    
    this[level](`Health check: ${component}`, {
      component,
      status,
      ...details,
      timestamp: new Date().toISOString()
    });
  }

  // Get log statistics
  getLogStats() {
    try {
      if (!fs.existsSync(this.logFile)) {
        return {
          totalLines: 0,
          errorCount: 0,
          warnCount: 0,
          infoCount: 0,
          debugCount: 0,
          lastModified: null
        };
      }

      const content = fs.readFileSync(this.logFile, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());
      
      const stats = {
        totalLines: lines.length,
        errorCount: 0,
        warnCount: 0,
        infoCount: 0,
        debugCount: 0,
        lastModified: fs.statSync(this.logFile).mtime.toISOString()
      };

      lines.forEach(line => {
        if (line.includes('[ERROR]')) stats.errorCount++;
        else if (line.includes('[WARN]')) stats.warnCount++;
        else if (line.includes('[INFO]')) stats.infoCount++;
        else if (line.includes('[DEBUG]')) stats.debugCount++;
      });

      return stats;
    } catch (error) {
      this.error('Failed to get log stats', { error: error.message });
      return null;
    }
  }

  // Clean old logs
  cleanOldLogs(daysToKeep = 30) {
    try {
      if (!fs.existsSync(this.logFile)) {
        return;
      }

      const stats = fs.statSync(this.logFile);
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

      if (stats.mtime < cutoffDate) {
        fs.unlinkSync(this.logFile);
        this.info('Old log file cleaned', {
          file: this.logFile,
          lastModified: stats.mtime.toISOString(),
          cutoffDate: cutoffDate.toISOString()
        });
      }
    } catch (error) {
      this.error('Failed to clean old logs', { error: error.message });
    }
  }
}

// Export singleton instance
module.exports = new Logger();
