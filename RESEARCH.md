# Planning Center
https://chatgpt.com/share/6a97bef2-7674-83e8-beb2-ff37e240f63d

https://api.planningcenteronline.com/docs/overview/json-api

https://api.planningcenteronline.com/personal_access_tokens

# Shure
https://www.shure.com/en-US/docs/commandstrings/SLXDplus

https://www.shure.com/en-US/docs/commandstrings/ULXD


# Yamaha QL-5 (Gemini)
There are no official or widely adopted NPM packages specifically built to handle Yamaha RCP/SCP commands natively with async/await (libraries named yamaha-nodejs target home audio AVR receivers, not pro-audio consoles). [1] 
However, because the protocol relies on asynchronous, request-response TCP sockets, you can easily wrap Node's native net socket in a modern Promise architecture.
The code below provides a lightweight, async/await utility class using native promises. It handles the manual socket overhead and allows you to linearize your code using standard await syntax.
## Async Yamaha RCP Client (YamahaClient.js)
```
const net = require('net');
class YamahaClient {
    constructor(ip, port = 49280) {
        this.ip = ip;
        this.port = port;
        this.socket = null;
        this.dataBuffer = '';
        this.pendingRequests = []; // Track active "get" promises
    }

    // Connect asynchronously
    connect() {
        return new Promise((resolve, reject) => {
            this.socket = new net.Socket();

            this.socket.connect(this.port, this.ip, () => {
                resolve();
            });

            this.socket.on('data', (data) => {
                this._handleData(data);
            });

            this.socket.on('error', (err) => {
                // Reject active promises on crash
                this.pendingRequests.forEach(req => req.reject(err));
                reject(err);
            });
        });
    }

    // Internal data routing parser
    _handleData(data) {
        this.dataBuffer += data.toString();
        const lines = this.dataBuffer.split('\n');
        this.dataBuffer = lines.pop(); // Retain incomplete chunks

        lines.forEach(line => {
            // Check if this matches a response to an expected GET query
            if (line.startsWith('NOTIFY MIXER:Current/InCh/Fader/Name')) {
                const match = line.match(/Name\s+(\d+)\s+0\s+"([^"]+)"/);
                if (match) {
                    const channelIndex = parseInt(match[1]);
                    const name = match[2];

                    // Find and resolve the matching pending request
                    const reqIndex = this.pendingRequests.findIndex(r => r.index === channelIndex);
                    if (reqIndex !== -1) {
                        this.pendingRequests[reqIndex].resolve(name);
                        this.pendingRequests.splice(reqIndex, 1); // Clear queue
                    }
                }
            }
        });
    }

    // Async getter
    getChannelName(channelNumber) {
        const index = channelNumber - 1;
        return new Promise((resolve, reject) => {
            // Store reference to resolve when TCP packet returns
            this.pendingRequests.push({ index, resolve, reject });
            this.socket.write(`get MIXER:Current/InCh/Fader/Name ${index} 0\n`);
        });
    }

    // Async setter (Fire and forget, or chains cleanly)
    setChannelName(channelNumber, newName) {
        const index = channelNumber - 1;
        return new Promise((resolve) => {
            this.socket.write(`set MIXER:Current/InCh/Fader/Name ${index} 0 "${newName}"\n`);
            // Brief pause to allow the physical console to accept sequential command packets
            setTimeout(resolve, 50); 
        });
    }

    // Disconnect safely
    disconnect() {
        if (this.socket) this.socket.destroy();
    }
}

module.exports = YamahaClient;
```

## Clean Implementation (app.js)
By importing the utility class above, your production code is fully asynchronous and removes messy nested callback loops:

```
const YamahaClient = require('./YamahaClient');
async function run() {
    const mixer = new YamahaClient('192.168.1.128');

    try {
        console.log('Connecting to QL5...');
        await mixer.connect();
        console.log('Connected successfully.\n');

        // 1. Fetch channel names cleanly using await
        const ch1Name = await mixer.getChannelName(1);
        const ch2Name = await mixer.getChannelName(2);
        
        console.log(`Current Ch 1 Name: "${ch1Name}"`);
        console.log(`Current Ch 2 Name: "${ch2Name}"\n`);

        // 2. Perform sequential async updates
        console.log('Updating channel names sequentially...');
        await mixer.setChannelName(1, 'Kick In');
        await mixer.setChannelName(2, 'Snare Top');
        console.log('Updates complete.');

    } catch (error) {
        console.error('An error occurred:', error.message);
    } finally {
        mixer.disconnect();
        console.log('Disconnected.');
    }
}

run();
```

If you want, let me know:

* 
* Do you need to expand this async architecture to handle volume fader values (dB) or mute states?
* Are you integrating this with an HTTP server frameworks like Express to trigger changes via REST endpoints?
* 

I can provide the wrapper methods to extend the class.
