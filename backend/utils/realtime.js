const EventEmitter = require('events');

// A simple global emitter to broadcast realtime updates (e.g., activities, stats, files)
class RealtimeEmitter extends EventEmitter {}

module.exports = new RealtimeEmitter();
