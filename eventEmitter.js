// Minimal EventEmitter for simple event handling
export class EventEmitter {
    constructor() {
        this.callbacks = {};
    }

    on(event, cb) {
        if (!this.callbacks[event]) {
            this.callbacks[event] = [];
        }
        this.callbacks[event].push(cb);
    }

    emit(event, data) {
        let cbs = this.callbacks[event];
        if (cbs) {
            cbs.forEach(cb => cb(data));
        }
    }

    off(event, cb) {
        if (this.callbacks[event]) {
            if (cb) {
                this.callbacks[event] = this.callbacks[event].filter(c => c !== cb);
            } else {
                delete this.callbacks[event];
            }
        }
    }
}