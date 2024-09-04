// Enums for product data
export enum SKU {
    SKU1 = "SKU1",
    SKU2 = "SKU2",
    SKU3 = "SKU3",
}

export enum Category {
    Category1 = "Iphone",
    Category2 = "Lap top",
    Category3 = "Caca",
}

export enum Tier {
    Tier1 = "Tier 1",
    Tier2 = "Tier 2",
    Tier3 = "Tier 3",
}

export enum Channel {
    Online = "Online",
    Offline = "Offline",
    Marketplace = "Marketplace",
    Partner = "Partner",
}

// Enums for actions
export enum ActionType {
    Event = "Event",
    Referal = "Referal",
    Game = "Game",
    Mission = "Mission",
}

export enum ConditionType {
    IS = '==',
    IS_NOT = '!=',
    EQUALS_OR_GREATER_THAN = '>=',
    EQUALS_OR_LESS_THAN = '<=',
    GREATER_THAN = '>',
    LESS_THAN = '<',
    IS_ONE_OF = 'in',
    IS_NOT_ONE_OF = 'not in'
};

export enum Currency {
    USD = "USD",
    VND = 'VND',
    EUR = 'EUR',
    THB = 'THB',
}

export interface CartConditions {
    total?: number;
    amount?: number;
    placeOrderDate?: number;
}

export interface ProductConditions {
    sku?: SKU;
    skus?: SKU[];
    category?: Category;
    categories?: Category[];
    attribute?: {
        tag: string;
    };
}

export interface CustomerConditions {
    tier?: Tier;
    registerDate?: number;
    clv?: number;
}

export interface SourceConditions {
    channels?: Channel[];
    storeId?: string;
}

export interface ActionConditions {
    eventId?: string;
    referalCode?: string;
    gameId?: string;
    missionId?: string;
}

export function ruleEngineEncode(ruleText: string): string {
    return Buffer.from(ruleText).toString('base64');
}

export function genNewRules(
    nameRuleEngine: string,
    Struct: 'Cart' | 'Product' | 'Customer' | 'Source' | 'Action',
    conditions: CartConditions | ProductConditions | CustomerConditions | SourceConditions | ActionConditions,
    pointAmounts: number[],
    isSelectVoucherList: string[],
    operator: ConditionType = ConditionType.IS,
    currency: Currency[],
    startTime: number,
    endTime: number,
    registerStartTime: number,
    registerEndTime: number,
    idString: string[]
): string[] {
    let listRules: string[] = [];
    const convertRuleString = nameRuleEngine.replace(/\s/g, '');
    for (let i = 0; i < currency.length; i++) {
        let rules: string = "";

        switch (Struct) {
            case 'Cart':
                const cartConditions = conditions as CartConditions;

                // Condition: total
                if (cartConditions.total) {
                    let ruleString = `rule "${nameRuleEngine}" {\n`;
                    ruleString += `    when\n      ${Struct}.Total ${operator} ${cartConditions.total} && ${Struct}.Currency == "${currency[i]}"\n`;
                    ruleString += `    then\n      ${Struct}.Result = "Condition met";\n      ${Struct}.MintPoint = ${Struct}.Total / ${pointAmounts[i]};\n`;
                    ruleString += `      ${Struct}.Voucher = ${JSON.stringify(isSelectVoucherList)};\n`;
                    ruleString += `      Retract("${nameRuleEngine}");\n`;
                    ruleString += `}`;
                    rules = ruleString;
                }

                // Condition: placeOrderDate
                if (cartConditions.placeOrderDate) {
                    let ruleString = `rule "${nameRuleEngine}" {\n`;
                    ruleString += `    when\n      ${startTime} <= ${Struct}.PlaceOrderDate && ${endTime} >= ${Struct}.PlaceOrderDate && ${Struct}.Currency == "${currency[i]}"\n`;
                    ruleString += `    then\n      ${Struct}.Result = "Condition met";\n      ${Struct}.MintPoint = ${Struct}.Total / ${pointAmounts[i]};\n`;
                    ruleString += `      ${Struct}.Voucher = ${JSON.stringify(isSelectVoucherList)};\n`;
                    ruleString += `      Retract("${nameRuleEngine}");\n`;
                    ruleString += `}`;
                    rules = ruleString;
                }

                // Condition: amount
                if (cartConditions.amount) {
                    let ruleString = `rule "${nameRuleEngine}" {\n`;
                    ruleString += `    when\n      ${Struct}.Amount ${operator} ${cartConditions.amount} && ${Struct}.Currency == "${currency[i]}"\n`;
                    ruleString += `    then\n      ${Struct}.Result = "Condition met";\n      ${Struct}.MintPoint = ${Struct}.Total / ${pointAmounts[i]};\n`;
                    ruleString += `      ${Struct}.Voucher = ${JSON.stringify(isSelectVoucherList)};\n`;
                    ruleString += `      Retract("${nameRuleEngine}");\n`;
                    ruleString += `}`;
                    rules = ruleString;
                }

                break;

            case 'Product':
                const productConditions = conditions as ProductConditions;

                // Condition: sku
                if (productConditions.sku) {
                    let ruleString = `rule "${convertRuleString}" {\n`;
                    ruleString += `    when\n      ${Struct}.Sku ${operator} "${productConditions.sku}" && ${Struct}.Currency == "${currency[i]}"\n`;
                    ruleString += `    then\n      ${Struct}.Result = "Condition met";\n      ${Struct}.MintPoint = ${Struct}.Total / ${pointAmounts[i]};\n`;
                    ruleString += `      ${Struct}.Voucher = ${JSON.stringify(isSelectVoucherList)};\n`;
                    ruleString += `      Retract("${convertRuleString}");\n`;
                    ruleString += `}`;
                    rules = ruleString;
                }

                // Condition: skus (array of SKUs)
                if (productConditions.skus) {
                    let ruleString = `rule "${convertRuleString}" {\n`;
                    ruleString += `    when\n      ${Struct}.Sku ${operator} (${productConditions.skus.map(sku => `"${sku}"`).join(', ')}) && ${Struct}.Currency == "${currency[i]}"\n`;
                    ruleString += `    then\n      ${Struct}.Result = "Condition met";\n      ${Struct}.MintPoint = ${Struct}.Total / ${pointAmounts[i]};\n`;
                    ruleString += `      ${Struct}.Voucher = ${JSON.stringify(isSelectVoucherList)};\n`;
                    ruleString += `      Retract("${convertRuleString}");\n`;
                    ruleString += `}`;
                    rules = ruleString;
                }

                // Condition: category
                if (productConditions.category) {
                    let ruleString = `rule "${convertRuleString}" {\n`;
                    ruleString += `    when\n      ${Struct}.Category ${operator} "${productConditions.category}" && ${Struct}.Currency == "${currency[i]}"\n`;
                    ruleString += `    then\n      ${Struct}.Result = "Condition met";\n      ${Struct}.MintPoint = ${Struct}.Total / ${pointAmounts[i]};\n`;
                    ruleString += `      ${Struct}.Voucher = ${JSON.stringify(isSelectVoucherList)};\n`;
                    ruleString += `      Retract("${convertRuleString}");\n`;
                    ruleString += `}`;
                    rules = ruleString;
                }

                // Condition: categories (array of categories)
                if (productConditions.categories) {
                    let ruleString = `rule "${convertRuleString}" {\n`;
                    ruleString += `    when\n      ${Struct}.Category ${operator} (${productConditions.categories.map(cat => `"${cat}"`).join(', ')}) && ${Struct}.Currency == "${currency[i]}"\n`;
                    ruleString += `    then\n      ${Struct}.Result = "Condition met";\n      ${Struct}.MintPoint = ${Struct}.Total / ${pointAmounts[i]};\n`;
                    ruleString += `      ${Struct}.Voucher = ${JSON.stringify(isSelectVoucherList)};\n`;
                    ruleString += `      Retract("${convertRuleString}");\n`;
                    ruleString += `}`;
                    rules = ruleString;
                }

                // Condition: attribute
                if (productConditions.attribute) {
                    let ruleString = `rule "${convertRuleString}" {\n`;
                    ruleString += `    when\n      ${Struct}.Attribute.Tag ${operator} "${productConditions.attribute.tag}" && ${Struct}.Currency == "${currency[i]}"\n`;
                    ruleString += `    then\n      ${Struct}.Result = "Condition met";\n      ${Struct}.MintPoint = ${Struct}.Total / ${pointAmounts[i]};\n`;
                    ruleString += `      ${Struct}.Voucher = ${JSON.stringify(isSelectVoucherList)};\n`;
                    ruleString += `      Retract("${convertRuleString}");\n`;
                    ruleString += `}`;
                    rules = ruleString;
                }
                break;

            case 'Customer':
                const customerConditions = conditions as CustomerConditions;

                // Condition: tier
                if (customerConditions.tier) {
                    let ruleString = `rule "${convertRuleString}" {\n`;
                    ruleString += `    when\n      ${Struct}.Tier ${operator} "${customerConditions.tier}" && ${Struct}.Currency == "${currency[i]}"\n`;
                    ruleString += `    then\n      ${Struct}.Result = "Condition met";\n      ${Struct}.MintPoint = ${Struct}.Total / ${pointAmounts[i]};\n`;
                    ruleString += `      ${Struct}.Voucher = ${JSON.stringify(isSelectVoucherList)};\n`;
                    ruleString += `      Retract("${convertRuleString}");\n`;
                    ruleString += `}`;
                    rules = ruleString;
                }

                // Condition: registerDate
                if (customerConditions.registerDate) {
                    let ruleString = `rule "${convertRuleString}" {\n`;
                    ruleString += `    when\n      ${registerStartTime} <= ${Struct}.RegisterDate && ${registerEndTime} >= ${Struct}.RegisterDate && ${Struct}.Currency == "${currency[i]}"\n`;
                    ruleString += `    then\n      ${Struct}.Result = "Condition met";\n      ${Struct}.MintPoint = ${Struct}.Total / ${pointAmounts[i]};\n`;
                    ruleString += `      ${Struct}.Voucher = ${JSON.stringify(isSelectVoucherList)};\n`;
                    ruleString += `      Retract("${convertRuleString}");\n`;
                    ruleString += `}`;
                    rules = ruleString;
                }

                // Condition: clv
                if (customerConditions.clv) {
                    let ruleString = `rule "${convertRuleString}" {\n`;
                    ruleString += `    when\n      ${Struct}.Clv ${operator} ${customerConditions.clv} && ${Struct}.Currency == "${currency[i]}"\n`;
                    ruleString += `    then\n      ${Struct}.Result = "Condition met";\n      ${Struct}.MintPoint = ${Struct}.Total / ${pointAmounts[i]};\n`;
                    ruleString += `      ${Struct}.Voucher = ${JSON.stringify(isSelectVoucherList)};\n`;
                    ruleString += `      Retract("${convertRuleString}");\n`;
                    ruleString += `}`;
                    rules = ruleString;
                }
                break;

            case 'Source':
                const sourceConditions = conditions as SourceConditions;

                // Condition: channels
                if (sourceConditions.channels) {
                    let ruleString = `rule "${convertRuleString}" {\n`;
                    ruleString += `    when\n      ${Struct}.Channel ${operator} (${sourceConditions.channels.map(channel => `"${channel}"`).join(', ')}) && ${Struct}.Currency == "${currency[i]}"\n`;
                    ruleString += `    then\n      ${Struct}.Result = "Condition met";\n      ${Struct}.MintPoint = ${Struct}.Total / ${pointAmounts[i]};\n`;
                    ruleString += `      ${Struct}.Voucher = ${JSON.stringify(isSelectVoucherList)};\n`;
                    ruleString += `      Retract("${convertRuleString}");\n`;
                    ruleString += `}`;
                    rules = ruleString;
                }

                // Condition: storeId
                if (sourceConditions.storeId) {
                    let ruleString = `rule "${convertRuleString}" {\n`;
                    ruleString += `    when\n      ${Struct}.StoreId ${operator} "${sourceConditions.storeId}" && ${Struct}.Currency == "${currency[i]}"\n`;
                    ruleString += `    then\n      ${Struct}.Result = "Condition met";\n      ${Struct}.MintPoint = ${Struct}.Total / ${pointAmounts[i]};\n`;
                    ruleString += `      ${Struct}.Voucher = ${JSON.stringify(isSelectVoucherList)};\n`;
                    ruleString += `      Retract("${convertRuleString}");\n`;
                    ruleString += `}`;
                    rules = ruleString;
                }
                break;

            case 'Action':
                const actionConditions = conditions as ActionConditions;

                // Condition: eventId
                if (actionConditions.eventId) {
                    let ruleString = `rule "${convertRuleString}" {\n`;
                    ruleString += `    when\n      ${Struct}.EventId ${operator} "${actionConditions.eventId}" && ${Struct}.Currency == "${currency[i]}"\n`;
                    ruleString += `    then\n      ${Struct}.Result = "Condition met";\n      ${Struct}.MintPoint = ${Struct}.Total / ${pointAmounts[i]};\n`;
                    ruleString += `      ${Struct}.Voucher = ${JSON.stringify(isSelectVoucherList)};\n`;
                    ruleString += `      Retract("${convertRuleString}");\n`;
                    ruleString += `}`;
                    rules = ruleString;
                }

                // Condition: referalCode
                if (actionConditions.referalCode) {
                    let ruleString = `rule "${convertRuleString}" {\n`;
                    ruleString += `    when\n      ${Struct}.ReferalCode ${operator} "${actionConditions.referalCode}" && ${Struct}.Currency == "${currency[i]}"\n`;
                    ruleString += `    then\n      ${Struct}.Result = "Condition met";\n      ${Struct}.MintPoint = ${Struct}.Total / ${pointAmounts[i]};\n`;
                    ruleString += `      ${Struct}.Voucher = ${JSON.stringify(isSelectVoucherList)};\n`;
                    ruleString += `      Retract("${convertRuleString}");\n`;
                    ruleString += `}`;
                    rules = ruleString;
                }

                // Condition: gameId
                if (actionConditions.gameId) {
                    let ruleString = `rule "${convertRuleString}" {\n`;
                    ruleString += `    when\n      ${Struct}.GameId ${operator} "${actionConditions.gameId}" && ${Struct}.Currency == "${currency[i]}"\n`;
                    ruleString += `    then\n      ${Struct}.Result = "Condition met";\n      ${Struct}.MintPoint = ${Struct}.Total / ${pointAmounts[i]};\n`;
                    ruleString += `      ${Struct}.Voucher = ${JSON.stringify(isSelectVoucherList)};\n`;
                    ruleString += `      Retract("${convertRuleString}");\n`;
                    ruleString += `}`;
                    rules = ruleString;
                }

                // Condition: missionId
                if (actionConditions.missionId) {
                    let ruleString = `rule "${convertRuleString}" {\n`;
                    ruleString += `    when\n      ${Struct}.MissionId ${operator} "${actionConditions.missionId}" && ${Struct}.Currency == "${currency[i]}"\n`;
                    ruleString += `    then\n      ${Struct}.Result = "Condition met";\n      ${Struct}.MintPoint = ${Struct}.Total / ${pointAmounts[i]};\n`;
                    ruleString += `      ${Struct}.Voucher = ${JSON.stringify(isSelectVoucherList)};\n`;
                    ruleString += `      Retract("${convertRuleString}");\n`;
                    ruleString += `}`;
                    rules = ruleString;
                }
                break;
        }

        if (rules.length > 0) {
            console.log(`${rules}`);
            const valueRuleAfterDecode: string = ruleEngineEncode(rules);
            listRules.push(valueRuleAfterDecode);
        }
    }
    return listRules;
}

export interface PointAmounts {
    value: number;
    selectProduct: string,
    currency: Currency,
}

export interface VoucherAmounts {
    discount: number;
    selectProduct: string,
    isFixDiscount: boolean,
    currency: Currency,
}

export function genNewRulesRedeem(
    convertRuleString: string,
    Struct: 'Cart' | 'Product' | 'Customer' | 'Source' | 'Action',
    conditions: CartConditions | ProductConditions | CustomerConditions | SourceConditions | ActionConditions,
    operator: ConditionType = ConditionType.IS,
    startTime: number,
    endTime: number,
    registerStartTime: number,
    registerEndTime: number,
    pointAmounts: PointAmounts[],
    voucherAmount: VoucherAmounts[]
): string[] {
    let listRules: string[] = [];
    let valueOfVoucherAmount: string[] = [];
    let valueOfPointAmounts: string[] = [];
    let whenStringRuleOfCurrency = "";

    for (let i = 0; i < voucherAmount.length; i++) {
        if (voucherAmount[i].isFixDiscount) {
            valueOfVoucherAmount.push(`      ${Struct}.Total = ${Struct}.Total - ${voucherAmount[i].discount};\n`);
            if (whenStringRuleOfCurrency.length == 0) {
                whenStringRuleOfCurrency += `      (${Struct}.Product == ${voucherAmount[i].selectProduct} && ${Struct}.Currency == "${voucherAmount[i].currency}")\n`;
            } else {
                whenStringRuleOfCurrency += `      || (${Struct}.Product == ${voucherAmount[i].selectProduct} && ${Struct}.Currency == "${voucherAmount[i].currency}")\n`;
            }
        } else {
            valueOfVoucherAmount.push(`      ${Struct}.Total = ${Struct}.Total * ${1 - (voucherAmount[i].discount / 100)};\n`);
        }
    }

    for (let i = 0; i < pointAmounts.length; i++) {
        valueOfPointAmounts.push(`      ${Struct}.MintPoint = ${Struct}.Total / ${pointAmounts[i].value};\n`);
        if (pointAmounts[i].selectProduct.length > 0) {
            if (whenStringRuleOfCurrency.length == 0) {
                whenStringRuleOfCurrency += `      (${Struct}.Product == ${pointAmounts[i].selectProduct} && ${Struct}.Currency == "${pointAmounts[i].currency}")\n`;
            } else {
                whenStringRuleOfCurrency += `      || (${Struct}.Product == ${pointAmounts[i].selectProduct} && ${Struct}.Currency == "${pointAmounts[i].currency}")\n`;
            }
        }
    }

    // whenStringRuleOfCurrency += ";"
    let rules: string = "";

    switch (Struct) {
        case 'Cart':
            const cartConditions = conditions as CartConditions;
            if (cartConditions.total) {
                let ruleString = `rule "${Struct}" {\n`;
                ruleString += `    when\n      ${Struct}.Total ${operator} ${cartConditions.total} &&\n${whenStringRuleOfCurrency}`;
                ruleString += `    then\n${valueOfPointAmounts}${valueOfVoucherAmount}      Retract("${convertRuleString}");\n`;
                ruleString += `}`;
                rules = ruleString;
            }
        // }
        // break;
        //     if (rules.length > 0) {
        //         console.log(`${rules}`);
        //         const valueRuleAfterDecode: string = ruleEngineEncode(rules);
        //         listRules.push(valueRuleAfterDecode);
        //     }
    }

    console.log("---------", rules);
    return listRules;
}

