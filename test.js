const ConditionType = {
    IS: '==',
    IS_NOT: '!=',
    EQUALS_OR_GREATER_THAN: '>=',
    EQUALS_OR_LESS_THAN: '<=',
    GREATER_THAN: '>',
    LESS_THAN: '<'
};

const CURRENCY_SYMBOLS = {
    USD: '$',
    VND: '₫',
    EUR: '€',
    THB: '฿'
};

function decodeNewRules(encodedRules) {
    const decodedRules = encodedRules.map((encodedRule) => {
        const ruleString = Buffer.from(encodedRule, 'base64').toString('utf-8');

        console.log("===========> Your rule string is: \n" + ruleString);

        let valueFieldMatch = null;

        if (!ruleString.includes('when\n        1 == 1')) {
            // Match the value field (e.g., Customer.RegisterDate, Cart.PlaceOrderDate, Product.Category, Customer.Birthday)
            valueFieldMatch = ruleString.match(
                /(Customer\.RegisterDate|Product\.Sku|Customer\.Tier|Customer\.Clv|Action\.GameId|Cart\.PlaceOrderDate|Cart\.Total|Product\.Category|Cart\.Amount|Customer\.Birthday)/,
            );
        }

        const valueField = valueFieldMatch ? valueFieldMatch[0].replace('.', ' ') : null;

        // Match the operator (==, !=, >=, <=, >, <)
        const operatorMatch = ruleString.match(/(==|!=|>=|<=|>|<)/);
        const operator = operatorMatch ? Object.keys(ConditionType).find(key => ConditionType[key] === operatorMatch[1]) : null;

        let operatorData = null;

        // Match the currency (USD, VND, etc.)
        let valueCurrency = "";
        let typeValue = "";
        let pointValue = null;
        let isAmount = true;

        // Special handling for date ranges and exact matches (e.g., Customer.RegisterDate, Cart.PlaceOrderDate, Customer.Birthday)
        if (valueField && (valueField.includes('RegisterDate') || valueField.includes('PlaceOrderDate') || valueField.includes('Birthday'))) {
            const dateMatches = ruleString.match(/(\d+)\s*<=\s*\w+\.\w+\s*&&\s*(\d+)\s*>=\s*\w+\.\w+/);
            if (dateMatches) {
                operatorData = [parseInt(dateMatches[1], 10), parseInt(dateMatches[2], 10)];
            } else {
                // Handle exact date matches
                const exactDateMatch = ruleString.match(/(==)\s+(\d+)/);
                operatorData = exactDateMatch ? exactDateMatch[2] : null;
            }
            typeValue = "date";
        } else {
            // Normal operator data (single value, could be a number or a string)
            const operatorDataMatch = ruleString.match(/(==|!=|>=|<=|>|<)\s+("[^"]*"|\d+(\.\d+)?)/);
            operatorData = operatorDataMatch ? operatorDataMatch[2].replace(/"/g, '') : null; // Remove quotes if it's a string
            const valueCurrencyMatch = ruleString.match(/Currency\s*==\s*"(\w+)"/);
            if (valueField && valueCurrencyMatch && !valueField.includes('Birthday')) {
                valueCurrency = CURRENCY_SYMBOLS[valueCurrencyMatch[1]] || "";
            }
            if (
                valueField && (valueField.includes('Amount') ||
                    valueField.includes('Total'))
            ) {
                typeValue = "number";
            } else {
                typeValue = "string";
            }
        }

        // Extract Voucher array if it exists
        let selectID = [];
        const voucherMatch = ruleString.match(/Voucher\s*=\s*\[([^\]]+)\];/);
        if (voucherMatch) {
            selectID = voucherMatch[1].split(',').map(v => v.trim().replace(/"/g, ''));
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
            valueCurrency = "";
        }

        return {
            valueField: valueField,
            operator: operator,
            operatorData: operatorData,
            valueCurrency: valueCurrency,
            typeValue,
            pointValue: pointValue,
            isAmount: isAmount,
            selectIdList: selectID
        };
    });

    console.log(decodedRules);

    return decodedRules;
}

const functionTest = (encodedRule) => {
    const ruleString = Buffer.from(encodedRule, 'base64').toString('utf-8');
    console.log("===========> Your rule string is: \n" + ruleString);
}

// Test case
decodeNewRules(
    "cnVsZSAiUnVsZV8xMCIgewogICAgICB3aGVuCiAgICAgICAgMSA9PSAxCiAgICAgIHRoZW4KICAgICAgICBDYXJ0LlJlc3VsdCA9ICJDb25kaXRpb24gbWV0IjsKICAgICAgICBDYXJ0Lk1pbnRQb2ludCA9IENhcnQuVG90YWwgLyAyOwogICAgICAgIENhcnQuVm91Y2hlciA9IFsiIl07CiAgICAgICAgUmV0cmFjdCgiUnVsZV8xMCIpOwogIH0="
);


