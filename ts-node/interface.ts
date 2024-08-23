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

// export enum ConditionType {
//     IS = '==',
//     IS_NOT = '!=',
//     EQUALS_OR_GREATER_THAN = '>=',
//     EQUALS_OR_LESS_THAN = '<=',
//     GREATER_THAN = '>',
//     LESS_THAN = '<',
//     IS_ONE_OF = 'in',
//     IS_NOT_ONE_OF = 'not in'
// };

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

export function ruleEngineDecode(encodedRuleText: string): string {
    return Buffer.from(encodedRuleText, 'base64').toString('utf-8');
}

export function genNewRules(
    nameRuleEngine: string,
    Struct: 'Cart' | 'Product' | 'Customer' | 'Source' | 'Action',
    conditions: CartConditions | ProductConditions | CustomerConditions | SourceConditions | ActionConditions,
    pointAmounts: number[],
    isSelectVoucher: boolean = false,
    operator: ConditionType = ConditionType.IS,
    currency: Currency[],
    startTime: number,
    endTime: number,
    registerStartTime: number,
    registerEndTime: number,
): string[] {
    let listRules: string[] = [];
    for (let i = 0; i < currency.length; i++) {
        let rules: string = "";
        switch (Struct) {
            case 'Cart':
                const cartConditions = conditions as CartConditions;
                if (cartConditions.placeOrderDate) {
                    let ruleString = `rule "${nameRuleEngine}" {\n`;
                    ruleString += `    when\n      ${startTime} <= ${Struct}.PlaceOrderDate && ${endTime} >= ${Struct}.PlaceOrderDate && ${Struct}.Currency == "${currency[i]}"\n`;
                    ruleString += `    then\n      ${Struct}.Result = "Condition met";\n      ${Struct}.MintPoint = ${Struct}.Total / ${pointAmounts[i]};\n      ${Struct}.Voucher = ${isSelectVoucher};\n      Retract("${nameRuleEngine}");\n`;
                    ruleString += `}`;
                    rules = ruleString;
                }
                if (cartConditions.amount) {
                    let ruleString = `rule "${nameRuleEngine}" {\n`;
                    ruleString += `    when\n      ${Struct}.Amount ${operator} ${cartConditions.amount} && ${Struct}.Currency == "${currency[i]}"\n`;
                    ruleString += `    then\n      ${Struct}.Result = "Condition met";\n      ${Struct}.MintPoint = ${Struct}.Total / ${pointAmounts[i]};\n      ${Struct}.Voucher = ${isSelectVoucher};\n      Retract("${nameRuleEngine}");\n`;
                    ruleString += `}`;
                    rules = ruleString;
                }
                if (cartConditions.total) {
                    let ruleString = `rule "${Struct}" {\n`;
                    ruleString += `    when\n      ${Struct}.Total ${operator} ${cartConditions.total} && ${Struct}.Currency == "${currency[i]}"\n`;
                    ruleString += `    then\n      ${Struct}.Result = "Condition met";\n      ${Struct}.MintPoint = ${Struct}.Total / ${pointAmounts[i]};\n      ${Struct}.Voucher = ${isSelectVoucher};\n      Retract("${nameRuleEngine}");\n`;
                    ruleString += `}`;
                    rules = ruleString;
                }
                break;
            case 'Product':
                const productConditions = conditions as ProductConditions;
                if (productConditions.sku) {
                    let ruleString = `rule "${nameRuleEngine}" {\n`;
                    ruleString += `    when\n      ${Struct}.Sku ${operator} "${productConditions.sku}" && ${Struct}.Currency == "${currency[i]}"\n`;
                    ruleString += `    then\n      ${Struct}.Result = "Condition met";\n      ${Struct}.MintPoint = ${Struct}.Total / ${pointAmounts[i]};\n      ${Struct}.Voucher = ${isSelectVoucher};\n      Retract("${nameRuleEngine}");\n`;
                    ruleString += `}`;
                    rules = ruleString;
                }
                if (productConditions.skus) {
                    let ruleString = `rule "${nameRuleEngine}" {\n`;
                    ruleString += `    when\n      ${Struct}.Sku ${operator} (${productConditions.skus.map(sku => `"${sku}"`).join(', ')}) && ${Struct}.Currency == "${currency[i]}"\n`;
                    ruleString += `    then\n      ${Struct}.Result = "Condition met";\n      ${Struct}.MintPoint = ${Struct}.Total / ${pointAmounts[i]};\n      ${Struct}.Voucher = ${isSelectVoucher};\n      Retract("${nameRuleEngine}");\n`;
                    ruleString += `}`;
                    rules = ruleString;
                }
                if (productConditions.category) {
                    let ruleString = `rule "${nameRuleEngine}" {\n`;
                    ruleString += `    when\n      ${Struct}.Category ${operator} "${productConditions.category}" && ${Struct}.Currency == "${currency[i]}"\n`;
                    ruleString += `    then\n      ${Struct}.Result = "Condition met";\n      ${Struct}.MintPoint = ${Struct}.Total / ${pointAmounts[i]};\n      ${Struct}.Voucher = ${isSelectVoucher};\n      Retract("${nameRuleEngine}");\n`;
                    ruleString += `}`;
                    rules = ruleString;
                }
                if (productConditions.categories) {
                    let ruleString = `rule "${nameRuleEngine}" {\n`;
                    ruleString += `    when\n      ${Struct}.Category ${operator} (${productConditions.categories.map(cat => `"${cat}"`).join(', ')}) && ${Struct}.Currency == "${currency[i]}"\n`;
                    ruleString += `    then\n      ${Struct}.Result = "Condition met";\n      ${Struct}.MintPoint = ${Struct}.Total / ${pointAmounts[i]};\n      ${Struct}.Voucher = ${isSelectVoucher};\n      Retract("${nameRuleEngine}");\n`;
                    ruleString += `}`;
                    rules = ruleString;
                }
                if (productConditions.attribute) {
                    let ruleString = `rule "${nameRuleEngine}" {\n`;
                    ruleString += `    when\n      ${Struct}.Attribute.Tag ${operator} "${productConditions.attribute.tag}" && ${Struct}.Currency == "${currency[i]}"\n`;
                    ruleString += `    then\n      ${Struct}.Result = "Condition met";\n      ${Struct}.MintPoint = ${Struct}.Total / ${pointAmounts[i]};\n      ${Struct}.Voucher = ${isSelectVoucher};\n      Retract("${nameRuleEngine}");\n`;
                    ruleString += `}`;
                    rules = ruleString;
                }
                break;
            case 'Customer':
                const customerConditions = conditions as CustomerConditions;
                if (customerConditions.tier) {
                    let ruleString = `rule "${nameRuleEngine}" {\n`;
                    ruleString += `    when\n      ${Struct}.Tier ${operator} "${customerConditions.tier}" && ${Struct}.Currency == "${currency[i]}"\n`;
                    ruleString += `    then\n      ${Struct}.Result = "Condition met";\n      ${Struct}.MintPoint = ${Struct}.Total / ${pointAmounts[i]};\n      ${Struct}.Voucher = ${isSelectVoucher};\n      Retract("${nameRuleEngine}");\n`;
                    ruleString += `}`;
                    rules = ruleString;
                }
                if (customerConditions.registerDate) {
                    let ruleString = `rule "${nameRuleEngine}" {\n`;
                    ruleString += `    when\n      ${registerStartTime} <= ${Struct}.RegisterDate && ${registerEndTime} >= ${Struct}.RegisterDate && ${Struct}.Currency == "${currency[i]}"\n`;
                    ruleString += `    then\n      ${Struct}.Result = "Condition met";\n      ${Struct}.MintPoint = ${Struct}.Total / ${pointAmounts[i]};\n      ${Struct}.Voucher = ${isSelectVoucher};\n      Retract("${nameRuleEngine}");\n`;
                    ruleString += `}`;
                    rules = ruleString;
                }
                if (customerConditions.clv) {
                    let ruleString = `rule "${nameRuleEngine}" {\n`;
                    ruleString += `    when\n      ${Struct}.Clv ${operator} ${customerConditions.clv} && ${Struct}.Currency == "${currency[i]}"\n`;
                    ruleString += `    then\n      ${Struct}.Result = "Condition met";\n      ${Struct}.MintPoint = ${Struct}.Total / ${pointAmounts[i]};\n      ${Struct}.Voucher = ${isSelectVoucher};\n      Retract("${nameRuleEngine}");\n`;
                    ruleString += `}`;
                    rules = ruleString;
                }
                break;

            case 'Source':
                const sourceConditions = conditions as SourceConditions;
                if (sourceConditions.channels) {
                    let ruleString = `rule "${nameRuleEngine}" {\n`;
                    ruleString += `    when\n      ${Struct}.Channel ${operator} (${sourceConditions.channels.map(channel => `"${channel}"`).join(', ')}) && ${Struct}.Currency == "${currency[i]}"\n`;
                    ruleString += `    then\n      ${Struct}.Result = "Condition met";\n      ${Struct}.MintPoint = ${Struct}.Total / ${pointAmounts[i]};\n      ${Struct}.Voucher = ${isSelectVoucher};\n      Retract("${nameRuleEngine}");\n`;
                    ruleString += `}`;
                    rules = ruleString;
                }
                if (sourceConditions.storeId) {
                    let ruleString = `rule "${nameRuleEngine}" {\n`;
                    ruleString += `    when\n      ${Struct}.StoreId ${operator} "${sourceConditions.storeId}" && ${Struct}.Currency == "${currency[i]}"\n`;
                    ruleString += `    then\n      ${Struct}.Result = "Condition met";\n      ${Struct}.MintPoint = ${Struct}.Total / ${pointAmounts[i]};\n      ${Struct}.Voucher = ${isSelectVoucher};\n      Retract("${nameRuleEngine}");\n`;
                    ruleString += `}`;
                    rules = ruleString;
                }
                break;

            case 'Action':
                const actionConditions = conditions as ActionConditions;
                if (actionConditions.eventId) {
                    let ruleString = `rule "${nameRuleEngine}" {\n`;
                    ruleString += `    when\n      ${Struct}.EventId ${operator} "${actionConditions.eventId}" && ${Struct}.Currency == "${currency[i]}"\n`;
                    ruleString += `    then\n      ${Struct}.Result = "Condition met";\n      ${Struct}.MintPoint = ${Struct}.Total / ${pointAmounts[i]};\n      ${Struct}.Voucher = ${isSelectVoucher};\n      Retract("${nameRuleEngine}");\n`;
                    ruleString += `}`;
                    rules = ruleString;
                }
                if (actionConditions.referalCode) {
                    let ruleString = `rule "${nameRuleEngine}" {\n`;
                    ruleString += `    when\n      ${Struct}.ReferalCode ${operator} "${actionConditions.referalCode}" && ${Struct}.Currency == "${currency[i]}"\n`;
                    ruleString += `    then\n      ${Struct}.Result = "Condition met";\n      ${Struct}.MintPoint = ${Struct}.Total / ${pointAmounts[i]};\n      ${Struct}.Voucher = ${isSelectVoucher};\n      Retract("${nameRuleEngine}");\n`;
                    ruleString += `}`;
                    rules = ruleString;
                }
                if (actionConditions.gameId) {
                    let ruleString = `rule "${nameRuleEngine}" {\n`;
                    ruleString += `    when\n      ${Struct}.GameId ${operator} "${actionConditions.gameId}" && ${Struct}.currency == "${currency[i]}"\n`;
                    ruleString += `    then\n      ${Struct}.Result = "Condition met";\n      ${Struct}.MintPoint = ${Struct}.Total / ${pointAmounts[i]};\n      ${Struct}.Voucher = ${isSelectVoucher};\n      Retract("${nameRuleEngine}");\n`;
                    ruleString += `}`;
                    rules = ruleString;
                }
                if (actionConditions.missionId) {
                    let ruleString = `rule "${nameRuleEngine}" {\n`;
                    ruleString += `    when\n      ${Struct}.MissionId ${operator} "${actionConditions.missionId}" && ${Struct}.Currency == "${currency[i]}"\n`;
                    ruleString += `    then\n      ${Struct}.Result = "Condition met";\n      ${Struct}.MintPoint = ${Struct}.Total / ${pointAmounts[i]};\n      ${Struct}.Voucher = ${isSelectVoucher};\n      Retract("${nameRuleEngine}");\n`;
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
    console.log(listRules);
    return listRules;
}

// export function decodeNewRules(listRules: string[]): {
//     nameRuleEngine: string,
//     Struct: string,
//     conditions: any,
//     pointAmounts: number[],
//     isSelectVoucher: boolean,
//     operator: ConditionType,
//     currency: Currency[],
//     startTime: number,
//     endTime: number,
//     registerStartTime: number,
//     registerEndTime: number,
//     itemChoosed: string | undefined
// }[] {
//     let decodedRules: any[] = [];

//     listRules.forEach(encodedRule => {
//         const ruleString = Buffer.from(encodedRule, 'base64').toString('utf-8');

//         // Extract parameters from the rule string
//         const nameRuleEngine = ruleString.match(/rule\s+"([^"]+)"/)?.[1] || '';
//         const Struct = ruleString.match(/\s+when\s+([^\s]+)\./)?.[1] || '';
//         const pointAmountMatch = ruleString.match(/\.Total\s+\/\s+(\d+)/);
//         const pointAmount = pointAmountMatch ? parseFloat(pointAmountMatch[1]) : 0;
//         const isSelectVoucher = ruleString.includes('.Voucher = true');
//         const operatorMatch = ruleString.match(/(>=|==|<=|>|<|in|not in)/);
//         const operator = operatorMatch ? operatorMatch[1] as ConditionType : ConditionType.IS;
//         const currencyMatch = ruleString.match(/\.Currency\s+==\s+"([^"]+)"/);
//         const currency = currencyMatch ? [currencyMatch[1] as Currency] : [];

//         // Extract the condition used and set itemChoosed based on the struct
//         let itemChoosed: string | undefined;
//         let conditions: any = {};

//         if (Struct === 'Cart') {
//             if (ruleString.includes(`${Struct}.Amount`)) {
//                 itemChoosed = 'Amount';
//                 const amountMatch = ruleString.match(/\.Amount\s+[>=<]+\s+(\d+)/);
//                 if (amountMatch) {
//                     conditions.amount = parseFloat(amountMatch[1]);
//                 }
//             } else if (ruleString.includes(`${Struct}.Total`)) {
//                 itemChoosed = 'Total';
//                 const totalMatch = ruleString.match(/\.Total\s+[>=<]+\s+(\d+)/);
//                 if (totalMatch) {
//                     conditions.total = parseFloat(totalMatch[1]);
//                 }
//             } else if (ruleString.includes(`${Struct}.PlaceOrderDate`)) {
//                 itemChoosed = 'PlaceOrderDate';
//                 const dateRangeMatch = ruleString.match(/(\d+)\s+<=\s+${Struct}\.PlaceOrderDate\s+&&\s+(\d+)/);
//                 if (dateRangeMatch) {
//                     conditions.placeOrderDate = {
//                         start: parseInt(dateRangeMatch[1], 10),
//                         end: parseInt(dateRangeMatch[2], 10)
//                     };
//                 }
//             }
//         } else if (Struct === 'Product') {
//             if (ruleString.includes(`${Struct}.Sku`)) {
//                 itemChoosed = 'Sku';
//                 const skuMatch = ruleString.match(/\.Sku\s+[>=<]+\s+"([^"]+)"/);
//                 if (skuMatch) {
//                     conditions.sku = skuMatch[1];
//                 }
//             } else if (ruleString.includes(`${Struct}.Category`)) {
//                 itemChoosed = 'Category';
//                 const categoryMatch = ruleString.match(/\.Category\s+[>=<]+\s+"([^"]+)"/);
//                 if (categoryMatch) {
//                     conditions.category = categoryMatch[1];
//                 }
//             } else if (ruleString.includes(`${Struct}.Attribute.Tag`)) {
//                 itemChoosed = 'Attribute.Tag';
//                 const attributeMatch = ruleString.match(/\.Attribute\.Tag\s+[>=<]+\s+"([^"]+)"/);
//                 if (attributeMatch) {
//                     conditions.attribute = { tag: attributeMatch[1] };
//                 }
//             }
//         } else if (Struct === 'Customer') {
//             if (ruleString.includes(`${Struct}.Tier`)) {
//                 itemChoosed = 'Tier';
//                 const tierMatch = ruleString.match(/\.Tier\s+[>=<]+\s+"([^"]+)"/);
//                 if (tierMatch) {
//                     conditions.tier = tierMatch[1];
//                 }
//             } else if (ruleString.includes(`${Struct}.RegisterDate`)) {
//                 itemChoosed = 'RegisterDate';
//                 const dateRangeMatch = ruleString.match(/(\d+)\s+<=\s+${Struct}\.RegisterDate\s+&&\s+(\d+)/);
//                 if (dateRangeMatch) {
//                     conditions.registerDate = {
//                         start: parseInt(dateRangeMatch[1], 10),
//                         end: parseInt(dateRangeMatch[2], 10)
//                     };
//                 }
//             } else if (ruleString.includes(`${Struct}.CLV`)) {
//                 itemChoosed = 'CLV';
//                 const clvMatch = ruleString.match(/\.CLV\s+[>=<]+\s+(\d+)/);
//                 if (clvMatch) {
//                     conditions.clv = parseInt(clvMatch[1], 10);
//                 }
//             }
//         } else if (Struct === 'Source') {
//             if (ruleString.includes(`${Struct}.Channel`)) {
//                 itemChoosed = 'Channel';
//                 const channelMatch = ruleString.match(/\.Channel\s+[>=<]+\s+"([^"]+)"/);
//                 if (channelMatch) {
//                     conditions.channels = [channelMatch[1]];
//                 }
//             } else if (ruleString.includes(`${Struct}.StoreID`)) {
//                 itemChoosed = 'StoreID';
//                 const storeIdMatch = ruleString.match(/\.StoreID\s+[>=<]+\s+"([^"]+)"/);
//                 if (storeIdMatch) {
//                     conditions.storeId = storeIdMatch[1];
//                 }
//             }
//         } else if (Struct === 'Action') {
//             if (ruleString.includes(`${Struct}.EventId`)) {
//                 itemChoosed = 'EventId';
//                 const eventIdMatch = ruleString.match(/\.EventId\s+[>=<]+\s+"([^"]+)"/);
//                 if (eventIdMatch) {
//                     conditions.eventId = eventIdMatch[1];
//                 }
//             } else if (ruleString.includes(`${Struct}.ReferalCode`)) {
//                 itemChoosed = 'ReferalCode';
//                 const referalCodeMatch = ruleString.match(/\.ReferalCode\s+[>=<]+\s+"([^"]+)"/);
//                 if (referalCodeMatch) {
//                     conditions.referalCode = referalCodeMatch[1];
//                 }
//             } else if (ruleString.includes(`${Struct}.GameId`)) {
//                 itemChoosed = 'GameId';
//                 const gameIdMatch = ruleString.match(/\.GameId\s+[>=<]+\s+"([^"]+)"/);
//                 if (gameIdMatch) {
//                     conditions.gameId = gameIdMatch[1];
//                 }
//             } else if (ruleString.includes(`${Struct}.MissionId`)) {
//                 itemChoosed = 'MissionId';
//                 const missionIdMatch = ruleString.match(/\.MissionId\s+[>=<]+\s+"([^"]+)"/);
//                 if (missionIdMatch) {
//                     conditions.missionId = missionIdMatch[1];
//                 }
//             }
//         }

//         decodedRules.push({
//             nameRuleEngine,
//             Struct,
//             conditions,
//             pointAmounts: [pointAmount],
//             isSelectVoucher,
//             operator,
//             currency,  // Fixed to be an array of strings
//             startTime: 0,
//             endTime: 0,
//             registerStartTime: 0,
//             registerEndTime: 0,
//             itemChoosed,
//         });
//     });

//     console.log(decodedRules);

//     return decodedRules;
// }

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

        console.log("ruleString", ruleString)

        const valueFieldMatch = ruleString.match(/(Cart|Product|Customer|Source|Action)\.(\w+)/);
        const valueField = valueFieldMatch ? `${valueFieldMatch[1]} ${valueFieldMatch[2]}` : null;

        const operatorMatch = ruleString.match(/(==|!=|>=|<=|>|<)/);
        const operator = operatorMatch ? Object.keys(ConditionType).find(key => ConditionType[key as keyof typeof ConditionType] === operatorMatch[1]) : null;

        const operatorDataMatch = ruleString.match(/(==|!=|>=|<=|>|<)\s+([\w\d]+)/);
        const operatorData = operatorDataMatch ? operatorDataMatch[2] : null;

        const valueCurrencyMatch = ruleString.match(/Currency\s*==\s*"(\w+)"/);
        const valueCurrency = valueCurrencyMatch ? CURRENCY_SYMBOLS[valueCurrencyMatch[1] as keyof typeof CURRENCY_SYMBOLS] : null;

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