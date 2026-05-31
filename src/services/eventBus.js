const EventEmitter = require('events');
const logger = require('../utils/logger');

class AppEventBus extends EventEmitter {
  emit(event, data) {
    logger.debug('Event emitted', { event, data: { ...data, token: data?.token ? '***' : undefined } });
    return super.emit(event, data);
  }
}

const bus = new AppEventBus();
bus.setMaxListeners(50);

module.exports = bus;
