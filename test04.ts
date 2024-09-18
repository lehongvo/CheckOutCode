import { Engine, Rule, RuleProperties, Event } from 'json-rules-engine';

function decodeBase64(encoded: string): string {
    return Buffer.from(encoded, 'base64').toString('utf-8');
}

function generateJsonFromRule(decodedString: string): RuleProperties {
    const ruleLines = decodedString.split('\n').map(line => line.trim());
    const ruleName = ruleLines[0].match(/rule\s+"(.+?)"/)?.[1];
    const whenConditions: { fact: string; path: string; operator: string; value: any; }[] = [];
    const thenActions: { type: string; params: { field: string; value: any; } }[] = [];

    let conditionStarted = false;
    let actionStarted = false;

    for (let i = 1; i < ruleLines.length; i++) {
        const line = ruleLines[i];

        if (line.startsWith('when')) {
            conditionStarted = true;
            actionStarted = false;
            continue;
        }

        if (line.startsWith('then')) {
            conditionStarted = false;
            actionStarted = true;
            continue;
        }

        if (conditionStarted) {
            const match = line.match(/(\w+)\.(\w+)\s+(==|>=|<=|>|<)\s+(.+?)$/);
            if (match) {
                whenConditions.push({
                    fact: match[1],
                    path: `$.${match[2]}`,
                    operator: getOperator(match[3]),
                    value: parseValue(match[4]),
                });
            }
        }

        if (actionStarted) {
            const matchResult = line.match(/(\w+)\.(\w+)\s+=\s+"(.+?)"/);
            if (matchResult) {
                thenActions.push({
                    type: 'setResult',
                    params: {
                        field: `${matchResult[1]}.${matchResult[2]}`,
                        value: matchResult[3],
                    }
                });
            }

            const matchMintPoint = line.match(/(\w+)\.(\w+)\s+=\s+(.+)/);
            if (matchMintPoint && matchMintPoint[3].startsWith('{')) {
                try {
                    thenActions.push({
                        type: 'setMintPoint',
                        params: {
                            field: `${matchMintPoint[1]}.${matchMintPoint[2]}`,
                            value: JSON.parse(matchMintPoint[3])
                        }
                    });
                } catch (error) {
                    console.error('Error parsing MintPoint JSON:', error);
                }
            }
        }
    }

    return {
        conditions: {
            all: whenConditions
        },
        event: {
            type: ruleName || 'defaultRule',
            params: {
                actions: thenActions
            }
        }
    };
}

function getOperator(operator: string): string {
    switch (operator) {
        case '==':
            return 'equal';
        case '>=':
            return 'greaterThanInclusive';
        case '<=':
            return 'lessThanInclusive';
        case '>':
            return 'greaterThan';
        case '<':
            return 'lessThan';
        default:
            throw new Error(`Unsupported operator: ${operator}`);
    }
}

function parseValue(value: string): any {
    if (!isNaN(Number(value))) {
        return Number(value);
    }
    return value.replace(/"/g, '');
}

async function runRuleEngine(ruleJson: RuleProperties, cart: any) {
    const engine = new Engine();

    const rule = new Rule(ruleJson);
    engine.addRule(rule);

    // Thêm các hành động tùy chỉnh
    engine.on('success', (event: Event, almanac) => {
        if (event.params && event.params.actions) {
            event.params.actions.forEach((action: any) => {
                const fieldParts = action.params.field.split('.');
                const field = fieldParts[1]; // Lấy phần sau dấu '.'
                cart[field] = action.params.value;
            });
        }
    });

    const facts = { Cart: cart };

    const { events } = await engine.run(facts);
    events.map(event => {
        if (event.params) {
            console.log(event.params.message);
        }
    });

    console.log("Final cart state:", cart);
}

async function main() {
    const encodedRuleValue = `cnVsZSAiZmFzZHMiIHsKICAgICAgd2hlbgogICAgICAgIENhcnQuVG90YWwgPT0gMQogICAgICB0aGVuCiAgICAgICAgQ2FydC5SZXN1bHQgPSAiQ29uZGl0aW9uIG1ldCI7CiAgICAgICAgQ2FydC5SZWRlbXBQb2ludCA9IFsKICAgICAgICAgICAgewogICAgICAgICAgICAgIENhcnQuSXNDYXJ0VG90YWw6IHRydWUsCiAgICAgICAgICAgICAgQ2FydC5Qb2ludEFtb3VudDogIjAiLAogICAgICAgICAgICAgIENhcnQuQ3VycmVuY3k6ICJWTkQiLAogICAgICAgICAgICAgIENhcnQuTWludFBvaW50OiAxMQogICAgICAgICAgICB9LAogICAgICAgICAgICB7CiAgICAgICAgICAgICAgQ2FydC5Jc0NhcnRUb3RhbDogZmFsc2UsCiAgICAgICAgICAgICAgIENhcnQuUHJvZHVjdE5hbWU6ICJLZXkgRkwgU3BvcnQiLAogICAgICAgICAgICAgIENhcnQuUG9pbnRBbW91bnQ6ICIyIiwKICAgICAgICAgICAgICBDYXJ0LkN1cnJlbmN5OiAiVVNEIiwKICAgICAgICAgICAgICBDYXJ0Lk1pbnRQb2ludDogNAogICAgICAgICAgICB9XTsKICAgICAgICBDYXJ0LlJlZGVtcFZvdWNoZXIgPSBbCiAgICAgICAgICAgIHsKICAgICAgICAgICAgICBDYXJ0LkNvbGxlY3Rpb25JZDogIjNiOTY5MzE2LTVkZjMtNDIwZS1iNzhlLTk5OTJiMTkwMDZmOCIsCiAgICAgICAgICAgICAgQ2FydC5Jc0NhcnRUb3RhbDogZmFsc2UsCiAgICAgICAgICAgICAgQ2FydC5Qcm9kdWN0TmFtZTogIk1vdXNlIExvZ2l0ZWNoIiwKICAgICAgICAgICAgICBDYXJ0LlRvdGFsOiBDYXJ0LlRvdGFsIC0gMSwKICAgICAgICAgICAgICBDYXJ0LkN1cnJlbmN5OiAiVk5EIiwKICAgICAgICAgICAgfSwKICAgICAgICAgICAgewogICAgICAgICAgICAgIENhcnQuQ29sbGVjdGlvbklkOiAiZDcwZGE2ZDUtZGJmYS00ZmU1LThhNWQtNjRiMjA1OGM0OGYwIiwKICAgICAgICAgICAgICBDYXJ0LklzQ2FydFRvdGFsOiB0cnVlLAogICAgICAgICAgICAgIENhcnQuVG90YWw6IENhcnQuVG90YWwgKiAwLjg4LAogICAgICAgICAgICB9XTsKICAgICAgICBSZXRyYWN0KCJmYXNkcyIpOwogIH0`;

    const decodedString = decodeBase64(encodedRuleValue);
    console.log("Decoded Rule String:", decodedString);

    const ruleJson = generateJsonFromRule(decodedString);
    console.log("Generated JSON Rule:", JSON.stringify(ruleJson, null, 2));

    // const cart = {
    //     Total: 250,
    //     Currency: "undefined", // Thêm Currency để khớp với rule
    //     Result: "",
    //     MintPoint: 0,
    //     Voucher: []
    // };

    // await runRuleEngine(ruleJson, cart); // Thêm await để chờ kết quả
}

main();
