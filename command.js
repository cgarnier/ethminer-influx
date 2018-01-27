const net = require('net');

module.exports = function (cmd, port = 3000, host = 'localhost') {

    return new Promise((resolve, reject) => {
        let client = new net.Socket();
        client.connect(port, host, _ => {
            client.write(JSON.stringify({
                id: 0,
                jsonrpc: "2.0",
                method: cmd
            }) + '\n');
        });

        client.on('data', data => {
            resolve(JSON.parse(data));
            client.destroy(); // kill client after server's response
        });

        client.on('error', err => reject(err))
    })

};