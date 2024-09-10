
/* eslint-disable camelcase */
const ruleEngineEncode = (str) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    let base64String = '';
    data.forEach((byte) => {
        base64String += String.fromCharCode(byte);
    });

    let ruleString = '';
    try {
        ruleString = btoa(base64String);
    } catch (_) {
        // Handle if needed
    }
    return ruleString;
};

const ConditionType = {
    0: '==',
    1: '!=',
    2: '>=',
    3: '<=',
    4: '>',
    5: '<',
    6: 'in',
    7: 'not in',
};

const genEncodedEarnConditions = ({
    ruleName,
    Struct,
    conditions,
    isRate = false,
    pointAmounts,
    collectionIds = [],
    operator,
    currencies,
    startTime,
    endTime,
}) => {
    const listRules = [];
    const formattedName = ruleName.replace(/[^a-zA-Z0-9]/g, '_');

    const generateRuleString = (
        type,
        value,
        currency,
        pointAmount,
        isRewardRate,
    ) => `rule "${formattedName}" {
      when
        ${type !== '' ? `${Struct}.${type} ${operator} ` : ''
        }${value} && ${Struct}.Currency == "${currency}"
      then
        Cart.Result = "Condition met";
        Cart.MintPoint = ${isRewardRate ? `Cart.Total / ${pointAmount}` : `${pointAmount}`
        };
        Cart.Voucher = ${JSON.stringify(collectionIds)};
        Retract("${formattedName}");
  }`;

    pointAmounts.forEach((_, i) => {
        let rules = '';

        switch (Struct) {
            case 'Cart':
                const cartConditions = conditions;
                if (cartConditions.total) {
                    rules += generateRuleString(
                        'Total',
                        cartConditions.total,
                        currencies[i],
                        pointAmounts[i],
                        isRate[i],
                    );
                }
                if (cartConditions.amount) {
                    rules += generateRuleString(
                        'Amount',
                        cartConditions.amount,
                        currencies[i],
                        pointAmounts[i],
                        isRate[i],
                    );
                }
                if (cartConditions.placeOrderDate) {
                    const conditionString =
                        operator === 'in' || operator === 'not in'
                            ? `${startTime} ${operator === 'in' ? '<=' : '>='
                            } ${Struct}.PlaceOrderDate && ${endTime} ${operator === 'in' ? '>=' : '<='
                            } ${Struct}.PlaceOrderDate`
                            : `${Struct}.PlaceOrderDate ${operator} ${startTime}`;
                    rules += generateRuleString(
                        '',
                        conditionString,
                        currencies[i],
                        pointAmounts[i],
                        isRate[i],
                    );
                }
                break;

            case 'Product':
                const productConditions = conditions;
                if (productConditions.sku) {
                    rules += generateRuleString(
                        'Sku',
                        `"${productConditions.sku}"`,
                        currencies[i],
                        pointAmounts[i],
                        isRate[i],
                    );
                }
                if (productConditions.skus) {
                    rules += generateRuleString(
                        'Sku',
                        `(${productConditions.skus.map((sku) => `"${sku}"`).join(', ')})`,
                        currencies[i],
                        pointAmounts[i],
                        isRate[i],
                    );
                }
                if (productConditions.category) {
                    rules += generateRuleString(
                        'Category',
                        `"${productConditions.category}"`,
                        currencies[i],
                        pointAmounts[i],
                        isRate[i],
                    );
                }
                if (productConditions.categories) {
                    rules += generateRuleString(
                        'Category',
                        `(${productConditions.categories
                            .map((cat) => `"${cat}"`)
                            .join(', ')})`,
                        currencies[i],
                        pointAmounts[i],
                        isRate[i],
                    );
                }
                if (productConditions.attribute) {
                    rules += generateRuleString(
                        'Attribute.Tag',
                        `"${productConditions.attribute.tag}"`,
                        currencies[i],
                        pointAmounts[i],
                        isRate[i],
                    );
                }
                break;

            case 'Customer':
                const customerConditions = conditions;
                if (customerConditions.tier) {
                    rules += generateRuleString(
                        'Tier',
                        `"${customerConditions.tier}"`,
                        currencies[i],
                        pointAmounts[i],
                        isRate[i],
                    );
                }
                if (customerConditions.registerDate) {
                    const conditionString =
                        operator === 'in' || operator === 'not in'
                            ? `${startTime} ${operator === 'in' ? '<=' : '>='
                            } ${Struct}.RegisterDate && ${endTime} ${operator === 'in' ? '>=' : '<='
                            } ${Struct}.RegisterDate`
                            : `${Struct}.RegisterDate ${operator} ${startTime}`;
                    rules += generateRuleString(
                        '',
                        conditionString,
                        currencies[i],
                        pointAmounts[i],
                        isRate[i],
                    );
                }
                if (customerConditions.clv) {
                    rules += generateRuleString(
                        'Clv',
                        customerConditions.clv,
                        currencies[i],
                        pointAmounts[i],
                        isRate[i],
                    );
                }
                if (customerConditions.birthday) {
                    rules += generateRuleString(
                        'Birthday',
                        customerConditions.birthday,
                        currencies[i],
                        pointAmounts[i],
                        isRate[i],
                    );
                }
                break;

            case 'Sources':
                const sourceConditions = conditions;
                if (sourceConditions.channel) {
                    rules += generateRuleString(
                        'Channel',
                        `(${sourceConditions.channels
                            .map((channel) => `"${channel}"`)
                            .join(', ')})`,
                        currencies[i],
                        pointAmounts[i],
                        isRate[i],
                    );
                }
                if (sourceConditions.storeId) {
                    rules += generateRuleString(
                        'Source',
                        `"${sourceConditions.storeId}"`,
                        currencies[i],
                        pointAmounts[i],
                        isRate[i],
                    );
                }
                break;

            case 'Action':
                const actionConditions = conditions;
                if (actionConditions.eventId) {
                    rules += generateRuleString(
                        'EventId',
                        `"${actionConditions.eventId}"`,
                        currencies[i],
                        pointAmounts[i],
                        isRate[i],
                    );
                }
                if (actionConditions.referalCode) {
                    rules += generateRuleString(
                        'ReferalCode',
                        `"${actionConditions.referalCode}"`,
                        currencies[i],
                        pointAmounts[i],
                        isRate[i],
                    );
                }
                if (actionConditions.gameId) {
                    rules += generateRuleString(
                        'GameId',
                        `"${actionConditions.gameId}"`,
                        currencies[i],
                        pointAmounts[i],
                        isRate[i],
                    );
                }
                if (actionConditions.missionId) {
                    rules += generateRuleString(
                        'MissionId',
                        `"${actionConditions.missionId}"`,
                        currencies[i],
                        pointAmounts[i],
                        isRate[i],
                    );
                }
                break;

            default:
                break;
        }

        if (rules !== '') {
            const encodedRules = ruleEngineEncode(rules);
            listRules.push(encodedRules);
        }
    });
    return listRules.join(', ');
};

const genEncodedEarnReward = ({
    ruleName,
    isRate,
    pointAmounts,
    collectionIds,
}) => {
    const listRules = [];
    const formattedName = ruleName.replace(/[^a-zA-Z0-9]/g, '_');

    const generateRuleString = (
        pointAmount,
        isRewardRate,
    ) => `rule "${formattedName}" {
      when
        1 == 1
      then
        Cart.Result = "Condition met";
        Cart.MintPoint = ${isRewardRate ? `Cart.Total / ${pointAmount}` : `${pointAmount}`
        };
        Cart.Voucher = ${JSON.stringify(collectionIds)};
        Retract("${formattedName}");
  }`;

    pointAmounts.forEach((_, i) => {
        let rules = '';

        rules += generateRuleString(pointAmounts[i], isRate[i]);

        if (rules !== '') {
            const encodedRules = ruleEngineEncode(rules);
            listRules.push(encodedRules);
        }
    });

    return listRules.join(', ');
};

const formatDate = (dateStr) => {
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month}-${day}`;
};

const formatCondition = (condition) => {
    const { type, sub_type } = condition;
    let result;

    switch (`${type}_${sub_type}`) {
        case 'Cart_Total':
            result = {
                total: condition.value,
            };
            break;

        case 'Cart_Amount':
            result = {
                amount: condition.value,
            };
            break;

        case 'Cart_Place Order Date':
            let startDateStr, endDateStr;
            const parts = condition.value.split(' - ');

            if (parts.length === 2) {
                [startDateStr, endDateStr] = parts;
            } else {
                startDateStr = condition.value;
                endDateStr = condition.value;
            }
            result = {
                placeOrderDate: {
                    startDate: formatDate(startDateStr),
                    endDate: formatDate(endDateStr),
                },
            };
            break;

        case 'Product_SKU':
            if (Array.isArray(condition.value)) {
                result = {
                    skus: condition.value,
                };
            }
            result = {
                sku: condition.value,
            };
            break;

        case 'Product_Category':
            if (Array.isArray(condition.value)) {
                result = {
                    categories: condition.value,
                };
            }
            result = {
                category: condition.value.label,
            };
            break;

        case 'Product_Attribute':
            result = {
                attribute: {
                    tag: condition.value.label,
                },
            };
            break;

        case 'Customer_Tier':
            result = {
                tier: condition.value.label,
            };
            break;

        case 'Customer_Register Date':
            let startStr, endStr;
            const partsRegisterDate = condition.value.split(' - ');

            if (partsRegisterDate.length === 2) {
                [startStr, endStr] = partsRegisterDate;
            } else {
                startStr = condition.value;
                endStr = condition.value;
            }
            result = {
                registerDate: {
                    startDate: formatDate(startStr),
                    endDate: formatDate(endStr),
                },
            };
            break;

        case 'Customer_Birthday':
            // const valueAsSeconds = dayjs(
            //     condition.value,
            //     "DateFormat.DATE_ONLY",
            // ).unix();
            // result = {
            //     birthday: valueAsSeconds,
            // };
            break;

        case 'Customer_CLV':
            result = {
                clv: condition.value,
            };
            break;

        case 'Sources_Channel':
            result = {
                channel: condition.value.label,
            };
            break;

        case 'Sources_Source':
            result = {
                storeId: condition.value,
            };
            break;

        case 'Action_Event':
            result = {
                eventId: condition.value,
            };
            break;

        case 'Action_Referal':
            result = {
                referalCode: condition.value,
            };
            break;

        case 'Action_Game':
            result = {
                gameId: condition.value,
            };
            break;

        case 'Action_Mission':
            result = {
                missionId: condition.value,
            };
            break;

        default:
            break;
    }
    return result;
};

function getCurrencyValue(symbol) {
    switch (symbol) {
        case '$':
            return 'USD';
        case '₫':
            return 'VND';
        case '€':
            return 'EUR';
        case '฿':
            return 'THB';
        default:
            return 'USD';
    }
}

const ConditionStringType = {
    IS: '==',
    IS_NOT: '!=',
    EQUALS_OR_GREATER_THAN: '>=',
    EQUALS_OR_LESS_THAN: '<=',
    GREATER_THAN: '>',
    LESS_THAN: '<',
    IS_ONE_OF: 'in',
    IS_NOT_ONE_OF: 'not in',
};

const CURRENCY_SYMBOLS = {
    USD: '$',
    VND: '₫',
    EUR: '€',
    THB: '฿',
};



const genEncodedRedempConditions = ({
    ruleName,
    Struct,
    conditions,
    operator,
    pointReward,
    voucherReward,
    startTime,
    endTime,
}) => {
    const formattedName = ruleName.replace(/[^a-zA-Z0-9]/g, '_');

    const generateRuleString = (type, value) => `rule "${formattedName}" {
      when
        ${type !== '' ? `${Struct}.${type} ${operator} ` : ''}${value}
      then
        Cart.Result = "Condition met";
        Cart.MintPoint = ${JSON.stringify(pointReward)};
        Cart.Voucher = ${JSON.stringify(voucherReward)};
        Retract("${formattedName}");
  }`;

    let rule = '';
    switch (Struct) {
        case 'Cart':
            const cartConditions = conditions;
            if (cartConditions.total) {
                rule += generateRuleString('Total', cartConditions.total);
            }
            if (cartConditions.amount) {
                rule += generateRuleString('Amount', cartConditions.amount);
            }
            if (cartConditions.placeOrderDate) {
                rule += generateRuleString(
                    '',
                    `${startTime} <= ${Struct}.PlaceOrderDate && ${endTime} >= ${Struct}.PlaceOrderDate`,
                );
            }
            break;

        case 'Product':
            const productConditions = conditions;
            if (productConditions.sku) {
                rule += generateRuleString('Sku', `"${productConditions.sku}"`);
            }
            if (productConditions.skus) {
                rule += generateRuleString(
                    'Sku',
                    `(${productConditions.skus.map((sku) => `"${sku}"`).join(', ')})`,
                );
            }
            if (productConditions.category) {
                rule += generateRuleString(
                    'Category',
                    `"${productConditions.category}"`,
                );
            }
            if (productConditions.categories) {
                rule += generateRuleString(
                    'Category',
                    `(${productConditions.categories
                        .map((cat) => `"${cat}"`)
                        .join(', ')})`,
                );
            }
            if (productConditions.attribute) {
                rule += generateRuleString(
                    'Attribute.Tag',
                    `"${productConditions.attribute.tag}"`,
                );
            }
            break;

        case 'Customer':
            const customerConditions = conditions;
            if (customerConditions.tier) {
                rule += generateRuleString('Tier', `"${customerConditions.tier}"`);
            }
            if (customerConditions.registerDate) {
                rule += generateRuleString(
                    '',
                    `${startTime} <= ${Struct}.RegisterDate && ${endTime} >= ${Struct}.RegisterDate`,
                );
            }
            if (customerConditions.clv) {
                rule += generateRuleString('Clv', customerConditions.clv);
            }
            if (customerConditions.birthday) {
                rule += generateRuleString('Birthday', customerConditions.birthday);
            }
            break;

        case 'Source':
            const sourceConditions = conditions;
            if (sourceConditions.channel) {
                rule += generateRuleString(
                    'Channel',
                    `(${sourceConditions.channels
                        .map((channel) => `"${channel}"`)
                        .join(', ')})`,
                );
            }
            if (sourceConditions.storeId) {
                rule += generateRuleString('StoreId', `"${sourceConditions.storeId}"`);
            }
            break;

        case 'Action':
            const actionConditions = conditions;
            if (actionConditions.eventId) {
                rule += generateRuleString('EventId', `"${actionConditions.eventId}"`);
            }
            if (actionConditions.referalCode) {
                rule += generateRuleString(
                    'ReferalCode',
                    `"${actionConditions.referalCode}"`,
                );
            }
            if (actionConditions.gameId) {
                rule += generateRuleString('GameId', `"${actionConditions.gameId}"`);
            }
            if (actionConditions.missionId) {
                rule += generateRuleString(
                    'MissionId',
                    `"${actionConditions.missionId}"`,
                );
            }
            break;

        default:
            break;
    }

    return ruleEngineEncode(rule);
};

const genEncodedRedempReward = ({
    ruleName,
    pointReward,
    voucherReward,
}) => {
    const formattedName = ruleName.replace(/[^a-zA-Z0-9]/g, '_');

    const generateRuleString = () => `rule "${formattedName}" {
    when
      1 == 1
    then
      Cart.Result = "Condition met";
      Cart.MintPoint = ${JSON.stringify(pointReward)};
      Cart.Voucher = ${JSON.stringify(voucherReward)};
      Retract("${formattedName}");
}`;

    return ruleEngineEncode(generateRuleString());
};


const getConditionOperator = (cond) => {
    if (cond.includes('<=')) {
        return 3;
    }
    if (cond.includes('>=')) {
        return 2;
    }
    if (cond.includes('==')) {
        return 0;
    }
    if (cond.includes('!=')) {
        return 1;
    }
    if (cond.includes('>')) {
        return 4;
    }
    if (cond.includes('<')) {
        return 5;
    }
    return null;
};

const formatSubType = (sub_type) => {
    if (sub_type === 'PlaceOrderDate') {
        return 'Place Order Date';
    }
    if (sub_type === 'RegisterDate') {
        return 'Register Date';
    }
    if (sub_type === 'Sku') {
        return 'SKU';
    }
    return sub_type;
};

function decodeNewRules(encodedRules) {
    let ruleString = '';
    try {
        ruleString = atob(encodedRule);
    } catch (_) {
        // Handle the error here if needed
    }
    // Match the value field (e.g., Customer.RegisterDate, Cart.PlaceOrderDate, Product.Category, Customer.Birthday)
    let valueFieldMatch = null;

    if (!ruleString.includes('when\n        1 == 1')) {
        valueFieldMatch = ruleString.match(
            /(Customer\.RegisterDate|Product\.Sku|Customer\.Tier|Customer\.Clv|Action\.GameId|Cart\.PlaceOrderDate|Product\.Category|Cart\.Amount|Customer\.Birthday|Action\.MissionId|Action\.ReferalCode|Action\.EventId|Sources\.Source|Cart\.Total)/,
        );
    }
    const valueField = valueFieldMatch
        ? valueFieldMatch[0].replace('.', ' ')
        : null;

    // Match the operator (==, !=, >=, <=, >, <)
    const operatorMatch = ruleString.match(/(==|!=|>=|<=|>|<|in|not in)/);
    let operator = operatorMatch
        ? Object.keys(ConditionStringType).find(
            (key) => ConditionStringType[key] === operatorMatch[1],
        )
        : null;

    let operatorData = null;

    // Match the currency (USD, VND, etc.)
    let valueCurrency = '';
    let typeValue = '';
    let pointValue = null;
    let isAmount = true;

    // Special handling for date ranges and exact matches (e.g., Customer.RegisterDate, Cart.PlaceOrderDate, Customer.Birthday)
    if (
        valueField &&
        (valueField.includes('RegisterDate') ||
            valueField.includes('PlaceOrderDate') ||
            valueField.includes('Birthday'))
    ) {
        const inDateMatches = ruleString.match(
            /(\d+)\s*<=\s*\w+\.\w+\s*&&\s*(\d+)\s*>=\s*\w+\.\w+/,
        );
        const notInDateMatches = ruleString.match(
            /(\d+)\s*>=\s*\w+\.\w+\s*&&\s*(\d+)\s*<=\s*\w+\.\w+/,
        );
        if (inDateMatches) {
            operator = 'IS_ONE_OF';
            operatorData = [
                parseInt(inDateMatches[1], 10),
                parseInt(inDateMatches[2], 10),
            ];
        } else if (notInDateMatches) {
            operator = 'IS_NOT_ONE_OF';
            operatorData = [
                parseInt(notInDateMatches[1], 10),
                parseInt(notInDateMatches[2], 10),
            ];
        } else {
            // Handle exact date matches
            const exactDateMatch = ruleString.match(/(==|>=|<=|!=|>|<)\s+(\d+)/);
            operatorData = exactDateMatch ? exactDateMatch[2] : null;
        }
        typeValue = 'date';
    } else {
        // Normal operator data (single value, could be a number or a string)
        const operatorDataMatch = ruleString.match(
            /(==|!=|>=|<=|>|<|in|not in)\s+("[^"]*"|\d+(\.\d+)?)/,
        );
        operatorData = operatorDataMatch
            ? operatorDataMatch[2].replace(/"/g, '')
            : null; // Remove quotes if it's a string
        const valueCurrencyMatch = ruleString.match(/Currency\s*==\s*"(\w+)"/);
        if (
            valueField &&
            valueCurrencyMatch &&
            !valueField.includes('Birthday')
        ) {
            valueCurrency = CURRENCY_SYMBOLS[valueCurrencyMatch[1]] || '';
        }
        if (
            valueField &&
            (valueField.includes('Amount') || valueField.includes('Total'))
        ) {
            typeValue = 'number';
        } else {
            typeValue = 'string';
        }
    }

    // Extract Voucher array if it exists
    let selectID = [];
    const voucherMatch = ruleString.match(/Voucher\s*=\s*\[([^\]]+)\];/);
    if (voucherMatch) {
        selectID = voucherMatch[1]
            .split(',')
            .map((v) => v.trim().replace(/"/g, ''));
    }

    // Extract MintPoint and determine if it's an amount or a calculation
    const mintPointMatch = ruleString.match(/MintPoint\s*=\s*(.*?);/);
    if (mintPointMatch) {
        const mintPointExpression = mintPointMatch[1].trim();
        if (/[+\-*/]/.test(mintPointExpression)) {
            isAmount = false;
            // Extract the numeric value from the expression
            const valueMatch = mintPointExpression.match(/\/\s*(\d+(\.\d+)?)/);
            if (valueMatch) {
                pointValue = parseFloat(valueMatch[1]);
            }
        } else {
            pointValue = parseFloat(mintPointExpression);
        }
    }

    // Ensure valueField is not null before using includes
    if (valueField && valueField.includes('Category')) {
        valueCurrency = '';
    }

    console.log(
        {
            valueField,
            operator,
            operatorData,
            valueCurrency,
            typeValue,
            pointValue,
            isAmount,
            selectIdList: selectID,
        }
    )
}

decodeNewRules(
    "cnVsZSAiUnVsZV8zMl9jb25kaXRpb24iIHsKICAgICAgd2hlbgogICAgICAgIDE3MjU2NDIwMDAgIT0gQ2FydC5QbGFjZU9yZGVyRGF0ZSAmJiBDYXJ0LkN1cnJlbmN5ID09ICJVU0QiCiAgICAgIHRoZW4KICAgICAgICBDYXJ0LlJlc3VsdCA9ICJDb25kaXRpb24gbWV0IjsKICAgICAgICBDYXJ0Lk1pbnRQb2ludCA9IENhcnQuVG90YWwgLyAyMjsKICAgICAgICBDYXJ0LlZvdWNoZXIgPSBbXTsKICAgICAgICBSZXRyYWN0KCJSdWxlXzMyX2NvbmRpdGlvbiIpOwogIH0="
)