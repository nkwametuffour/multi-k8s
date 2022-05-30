'use strict';

const redis = require('redis');
const keys = require('./keys');

const redisClient = redis.createClient({
    host: keys.redisHost,
    port: keys.redisPort,
    retry_strategy: () => 1000
});
const redisSubscriber = redisClient.duplicate();

function fib(index) {
    if (index < 2) return 1;
    return fib(index - 1) + fib(index - 2);
}

// On receiving a publish message to the subscribe event below,
// calculate fib of value and insert into hash
redisSubscriber.on('message', (channel, message) => {
    redisClient.hset('values', message, fib(parseInt(message)));
});
redisSubscriber.subscribe('insert');  // Subscribe to insert events
