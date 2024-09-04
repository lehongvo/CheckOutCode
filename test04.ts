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
            const match = line.match(/(\w+)\.(\w+)\s+(==|>=|<=|>|<)\s+(.+?)\s+&&\s+(\w+)\.Currency\s+==\s+"(.+?)"/);
            if (match) {
                whenConditions.push({
                    fact: match[1],
                    path: `$.${match[2]}`,
                    operator: getOperator(match[3]),
                    value: parseValue(match[4]),
                }, {
                    fact: match[5],
                    path: '$.Currency',
                    operator: 'equal',
                    value: match[6],
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

            const matchMintPoint = line.match(/(\w+)\.(\w+)\s+=\s+(\w+)\.(\w+)\s+\/\s+(\d+)/);
            if (matchMintPoint) {
                thenActions.push({
                    type: 'setMintPoint',
                    params: {
                        field: `${matchMintPoint[1]}.${matchMintPoint[2]}`,
                        value: {
                            "$divide": [`$${matchMintPoint[3]}.${matchMintPoint[4]}`, parseInt(matchMintPoint[5])]
                        }
                    }
                });
            }

            const matchVoucher = line.match(/(\w+)\.(\w+)\s+=\s+\[(.+)\]/);
            if (matchVoucher) {
                thenActions.push({
                    type: 'setVoucher',
                    params: {
                        field: `${matchVoucher[1]}.${matchVoucher[2]}`,
                        value: matchVoucher[3].split(',').map(v => v.trim().replace(/"/g, '')),
                    }
                });
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
                const field = fieldParts[1];
                cart[field] = action.params.value;
            });
        }
    });

    const facts = { Cart: cart };

    console.log("Initial cart state:", cart);

    const { events } = await engine.run(facts);
    events.map(event => {
        if (event.params) {
            console.log(event.params.message);
        }
    });

    console.log("Final cart state:", cart);
}

async function main() {
    const encodedRuleValue = `cnVsZSAicnVsZV9wb2ludCIgewogICAgICB3aGVuCiAgICAgICAgQ2FydC5Ub3RhbCA9PSAxOTk5CiAgICAgIHRoZW4KICAgICAgICBDYXJ0LlJlc3VsdCA9ICJDb25kaXRpb24gbWV0IjsKICAgICAgICBDYXJ0Lk1pbnRQb2ludCA9IFt7InBvaW50X2NhcnRfdG90YWwiOnsiY3VycmVuY3lfaWQiOiJVU0QiLCJwb2ludF9hbW91bnQiOiIiLCJ2YWx1ZSI6IjEiLCJhbW91bnRfdmFsdWUiOiIifSwicG9pbnRfcHJvZHVjdF9yZXdhcmQiOnsiY3VycmVuY3lfaWQiOiJVU0QiLCJwcm9kdWN0X25hbWUiOnsiaWQiOjEsInZhbHVlIjoiTW91c2UgTG9naXRlY2giLCJsYWJlbCI6Ik1vdXNlIExvZ2l0ZWNoIn0sInBvaW50X2Ftb3VudCI6IiIsInZhbHVlIjoiMSIsImFtb3VudF92YWx1ZSI6IiJ9fV07CiAgICAgICAgQ2FydC5Wb3VjaGVyID0gW3siY29sbGVjdGlvbl9pZCI6IiIsInBvaW50X2NhcnRfdG90YWwiOnsiY3VycmVuY3lfaWQiOjAsInZhbHVlIjoiIiwiZGlzY291bnRfcmF0ZSI6IiJ9LCJwb2ludF9wcm9kdWN0X3Jld2FyZCI6eyJjdXJyZW5jeV9pZCI6MCwicHJvZHVjdF9uYW1lIjoiIiwiZGlzY291bnRfcmF0ZSI6IiIsInZhbHVlIjoiIn19XTsKICAgICAgICBSZXRyYWN0KCJydWxlX3BvaW50Iik7CiAgfQ==`;
    // vc: => 

    const decodedString = decodeBase64(encodedRuleValue);
    console.log("Decoded Rule String:", decodedString);

    const ruleJson = generateJsonFromRule(decodedString);
    console.log("Generated JSON Rule:", JSON.stringify(ruleJson, null, 2));

    console.log("generateJsonFromRule", generateJsonFromRule);

    const cart = {
        Total: 250,
        Currency: "undefined",
        Result: "",
        MintPoint: 0,
        Voucher: []
    };

    await runRuleEngine(ruleJson, cart);
}

main();