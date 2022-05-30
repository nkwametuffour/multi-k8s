'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');
const redis = require('redis');

const keys = require('./keys');

// Create Express app and setup middleware
const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(bodyParser.json());

// Postgre client setup
const pgClient = new Pool({
    host: keys.pgHost,
    port: keys.pgPort,
    user: keys.pgUser,
    password: keys.pgPassword,
    database: keys.pgDatabase
});

pgClient.on('connect', (client) => {
    client
        .query('CREATE TABLE IF NOT EXISTS values (number INT)')
        .catch(err => console.error(err));
});

// Redis client setup
const redisClient = redis.createClient({
    host: keys.redisHost,
    port: keys.redisPort,
    retry_strategy: () => 1000
});
// Duplicate necessary because from the redis library doc,
// a client that listens cannot be used for any other purpose. TO BE CONFIRMED
const redisPublisher = redisClient.duplicate();

// Express router handlers
app.get('/', (req, res) => {
    res.send('Hi!');
});

app.get('/values/all', async (req, res) => {
    const values = await pgClient.query('SELECT * FROM values');

    res.send(values.rows);
});

app.get('/values/current', async (req, res) => {
    redisClient.hgetall('values', (err, values) => {
        if (err) return res.send({ error: `Could not fetch current values: ${err}` });

        res.send(values);
    });
});

app.post('/values', async (req, res) => {
    const index = req.body.index;

    if (parseInt(index) > 40) {
        return res.status(422).send({ error: 'Index too high' });
    }

    redisClient.hset('values', index, 'Nothing yet!');
    redisPublisher.publish('insert', index);
    pgClient.query('INSERT INTO values (number) VALUES ($1)', [index])
        .catch(err => console.error(err));

    res.send({ working: true });
});

app.listen(PORT, () => {
    console.log(`Server started and listening on port ${PORT}`);
});
