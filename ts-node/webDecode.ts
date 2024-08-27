export enum ConditionType {
    IS = '==',
    IS_NOT = '!=',
    EQUALS_OR_GREATER_THAN = '>=',
    EQUALS_OR_LESS_THAN = '<=',
    GREATER_THAN = '>',
    LESS_THAN = '<'
};

const CURRENCY_SYMBOLS = {
    USD: '$',
    VND: '₫',
    EUR: '€',
    THB: '฿'
};

export function decodeNewRules(encodedRules: string[]): any[] {
    const decodedRules = encodedRules.map((encodedRule) => {
        const ruleString = Buffer.from(encodedRule, 'base64').toString('utf-8');

        console.log("===========> Your rule string is: \n" + ruleString);

        // Match the value field (e.g., Customer.RegisterDate, Cart.PlaceOrderDate, Product.Category, Customer.Birthday)
        const valueFieldMatch = ruleString.match(/(Customer\.RegisterDate|Cart\.PlaceOrderDate|Cart\.Total|Product\.Category|Cart\.Amount|Customer\.Birthday)/);
        const valueField = valueFieldMatch ? valueFieldMatch[0].replace('.', ' ') : null;

        // Match the operator (==, !=, >=, <=, >, <)
        const operatorMatch = ruleString.match(/(==|!=|>=|<=|>|<)/);
        const operator = operatorMatch ? Object.keys(ConditionType).find(key => ConditionType[key as keyof typeof ConditionType] === operatorMatch[1]) : null;

        let operatorData: any = null;

        // Match the currency (USD, VND, etc.)
        let valueCurrency = "";

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
        } else {
            // Normal operator data (single value, could be a number or a string)
            const operatorDataMatch = ruleString.match(/(==|!=|>=|<=|>|<)\s+("[^"]*"|\d+(\.\d+)?)/);
            operatorData = operatorDataMatch ? operatorDataMatch[2].replace(/"/g, '') : null; // Remove quotes if it's a string
            const valueCurrencyMatch = ruleString.match(/Currency\s*==\s*"(\w+)"/);
            if (valueField && valueCurrencyMatch && !valueField.includes('Birthday')) {
                valueCurrency = CURRENCY_SYMBOLS[valueCurrencyMatch[1] as keyof typeof CURRENCY_SYMBOLS] || "";
            }
        }

        return {
            ValueField: valueField,
            operator: operator,
            operatorData: operatorData,
            ValueCurrency: valueCurrency
        };
    });

    console.log(decodedRules);

    return decodedRules;
}







