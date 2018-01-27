const command = require('./command');
const Influx = require('influx');
const os = require('os');

const hostname = process.env.HOSTNAME || os.hostname();
const db = process.env.INFLUX_DB || 'miners_db';

const influx = new Influx.InfluxDB({
    host: process.env.INFLUX_HOST || 'localhost',
    database: db,
    schema: [
        {
            measurement: 'node_stats',
            fields: {
                up_time: Influx.FieldType.INTEGER,
                hash_rate: Influx.FieldType.INTEGER,
                shares: Influx.FieldType.INTEGER,
                rejected_shares: Influx.FieldType.INTEGER,
                invalid_shares: Influx.FieldType.INTEGER,
                pool_switches: Influx.FieldType.INTEGER
            },
            tags: [
                'host'
            ]
        },
        {
            measurement: 'gpu_stats',
            fields: {
                id: Influx.FieldType.INTEGER,
                hash_rate: Influx.FieldType.INTEGER
            },
            tags: [
                'host', 'gpu'
            ]
        }
    ]
});

class Reporter {
    export(res) {
        let nodeStats = res;
        let gpuStats = res.gpu;
        delete nodeStats.gpu;
        influx.writePoints([
            {
                measurement: 'node_stats',
                tags: {host: hostname},
                fields: nodeStats,
            },
            ...gpuStats.map((g, i) => {
                return {
                    measurement: 'gpu_stats',
                    tags: {host: hostname, gpu: `${i}`},
                    fields: g
                }
            })
        ])
    }
    constructor() {
        this.timer = process.env.TIMER || 5000;
        this.port = process.env.ETHMINER_PORT || 3000;
        this.host = process.env.ETHMINER_HOST || '127.0.0.1'
    }

    query() {
        return command('miner_getstat1', this.port, this.host)
            .then(res => {
                return res.result
            })
    }

    format(raw) {
        // https://github.com/ethereum-mining/ethminer/blob/master/libapicore/ApiServer.cpp
        return {
            up_time: parseInt(raw[1]),
            hash_rate: parseInt(raw[2].split(';')[0]),
            shares: parseInt(raw[2].split(';')[1]),
            rejected_shares: parseInt(raw[2].split(';')[2]),
            gpu: raw[3].split(';').map((hashRate, id) => {
                return {
                    hash_rate: parseInt(hashRate)
                }
            }),
            invalid_shares: parseInt(raw[8].split(';')[0]),
            pool_switches: parseInt(raw[8].split(';')[1])
        }
    }

    log(res) {
        if (!process.env.DEBUG) return res;
        console.log(res);
        return res
    }

    checkDatabase() {
        return influx.getDatabaseNames()
            .then(names => {
                if (!names.includes(db)) {
                    return influx.createDatabase(db);
                }
            })
            .catch(err => {
                console.error(`Error creating Influx database!`);
            })
    }

    run() {
        this.checkDatabase()
            .then(_ => {
                setInterval(_ => {
                    this.query()
                        .then(res => this.format(res))
                        .then(res => this.log(res))
                        .then(res => this.export(res))
                }, this.timer)
            });
    }
}

module.exports = Reporter;