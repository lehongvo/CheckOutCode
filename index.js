const express = require('express');
const { Engine } = require('json-rules-engine');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const engine = new Engine();

const rulesStorage = {};

app.post('/api/rules', (req, res) => {
    const { name, conditions, event } = req.body;

    if (!name || !conditions || !event) {
        return res.status(400).json({ message: 'Name, conditions, and event are required' });
    }

    const rule = { conditions, event };
    rulesStorage[name] = rule;

    engine.addRule(rule);
    res.status(201).json({ message: `Rule '${name}' created successfully` });
});

app.get('/api/rules/:name', (req, res) => {
    const ruleName = req.params.name;
    const rule = rulesStorage[ruleName];

    if (!rule) {
        return res.status(404).json({ message: `Rule '${ruleName}' not found` });
    }

    res.json(rule);
});

app.post('/api/rules/check', async (req, res) => {
    const facts = req.body;

    console.log("Received facts:", facts);

    try {
        const { events } = await engine.run(facts);
        console.log("Triggered events:", events);
        if (events.length > 0) {
            res.json({ message: events.map(event => event.params.message) });
        } else {
            res.json({ message: 'No rules triggered' });
        }
    } catch (error) {
        console.error("Error running engine:", error);
        res.status(500).json({ message: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
