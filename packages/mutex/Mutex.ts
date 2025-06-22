export class Mutex {
    private _locked = false;
    private _queue: (() => void)[] = [];
 
    async acquire(timeout?: number): Promise<() => void> {
        if (this._locked) {
            if (timeout !== undefined) {
                await new Promise<void>((resolve, reject) => {
                    let isTimeout = false;
                    setTimeout(() => {
                        isTimeout = true;
                        reject(new Error('Mutex acquire timeout'));
                    }, timeout);

                    this._queue.push(() => {
                        if (isTimeout) {
                            const next = this._queue.shift();
                            if (next) {
                                next();
                            }
                            return;
                        }
                        resolve();
                    });
                });


            } else {
                await new Promise<void>((resolve) => this._queue.push(resolve));
            }
        }
        this._locked = true;
        return () => {
            this._locked = false;
            const next = this._queue.shift();
            if (next) {
                next();
            }
        };
    }
} 