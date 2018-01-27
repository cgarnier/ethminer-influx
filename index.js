const Influx = require('influx');

const timer = process.env.TIMER;
const Reporter = require('./reporter');
const reporter = new Reporter();

reporter.run();
