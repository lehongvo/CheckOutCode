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

export interface DateRange {
    startDate: string;
    endDate: string;
}

export interface CartConditions {
    total?: number;
    amount?: number;
    placeOrderDate?: DateRange;
}

export interface ProductConditions {
    sku?: SKU;
    skus?: SKU[];
    category?: Category;
    categories?: Category[];
    attribute?: {
        tag: string;
        value: string;
    };
}

export interface CustomerConditions {
    tier?: Tier;
    registerDate?: DateRange;
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
    isSelectVoucher: boolean = false,
    operator: ConditionType = ConditionType.IS,
    currency: Currency[]
): string[] {
    let listRules: string[] = [];
    for (let i = 0; i < currency.length; i++) {
        let rules: string = "";
        switch (Struct) {
            case 'Cart':
                const cartConditions = conditions as CartConditions;
                if (cartConditions.placeOrderDate) {
                    let ruleString = `rule "${nameRuleEngine}" {\n`;
                    ruleString += `    when\n      ${Struct}.PlaceOrderDate.StartDate >= now() && ${Struct}.PlaceOrderDate.EndDate <= now() && ${Struct}.Currency == "${currency[i]}"\n"`;
                    ruleString += `    then\n      ${Struct}.Result = "Condition met";\n      ${Struct}.MintPoint = ${Struct}.Total / ${pointAmounts[i]};\n      ${Struct}.Voucher = ${isSelectVoucher};\n`;
                    ruleString += `}`;
                    rules = ruleString;
                }
                if (cartConditions.amount) {
                    let ruleString = `rule "${nameRuleEngine}" {\n`;
                    ruleString += `    when\n      ${Struct}.Amount ${operator} ${cartConditions.amount} && ${Struct}.Currency == "${currency[i]}"\n`;
                    ruleString += `    then\n      ${Struct}.Result = "Condition met";\n      ${Struct}.MintPoint = ${Struct}.Total / ${pointAmounts[i]};\n      ${Struct}.Voucher = ${isSelectVoucher};\n`;
                    ruleString += `}`;
                    rules = ruleString;
                }
                if (cartConditions.total) {
                    let ruleString = `rule "${Struct}" {\n`;
                    ruleString += `    when\n      ${Struct}.Total ${operator} ${cartConditions.total} && ${Struct}.Currency == "${currency[i]}"\n`;
                    ruleString += `    then\n      ${Struct}.Result = "Condition met";\n      ${Struct}.MintPoint = ${Struct}.Total / ${pointAmounts[i]};\n      ${Struct}.Voucher = ${isSelectVoucher};\n`;
                    ruleString += `}`;
                    rules = ruleString;
                }
                break;
            case 'Product':
                const productConditions = conditions as ProductConditions;
                if (productConditions.sku) {
                    let ruleString = `rule "${nameRuleEngine}" {\n`;
                    ruleString += `    when\n      ${Struct}.Sku ${operator} "${productConditions.sku}" && ${Struct}.Currency == "${currency[i]}"\n`;
                    ruleString += `    then\n      ${Struct}.Result = "Condition met";\n      ${Struct}.MintPoint = ${Struct}.Total / ${pointAmounts[i]};\n      ${Struct}.Voucher = ${isSelectVoucher};\n`;
                    ruleString += `}`;
                    rules = ruleString;
                }
                if (productConditions.skus) {
                    let ruleString = `rule "${nameRuleEngine}" {\n`;
                    ruleString += `    when\n      ${Struct}.Sku ${operator} (${productConditions.skus.map(sku => `"${sku}"`).join(', ')}) && ${Struct}.Currency == "${currency[i]}"\n`;
                    ruleString += `    then\n      ${Struct}.Result = "Condition met";\n      ${Struct}.MintPoint = ${Struct}.Total / ${pointAmounts[i]};\n      ${Struct}.Voucher = ${isSelectVoucher};\n`;
                    ruleString += `}`;
                    rules = ruleString;
                }
                if (productConditions.category) {
                    let ruleString = `rule "${nameRuleEngine}" {\n`;
                    ruleString += `    when\n      ${Struct}.Category ${operator} "${productConditions.category}" && ${Struct}.Currency == "${currency[i]}"\n`;
                    ruleString += `    then\n      ${Struct}.Result = "Condition met";\n      ${Struct}.MintPoint = ${Struct}.Total / ${pointAmounts[i]};\n      ${Struct}.Voucher = ${isSelectVoucher};\n`;
                    ruleString += `}`;
                    rules = ruleString;
                }
                if (productConditions.categories) {
                    let ruleString = `rule "${nameRuleEngine}" {\n`;
                    ruleString += `    when\n      ${Struct}.Category ${operator} (${productConditions.categories.map(cat => `"${cat}"`).join(', ')}) && ${Struct}.Currency == "${currency[i]}"\n`;
                    ruleString += `    then\n      ${Struct}.Result = "Condition met";\n      ${Struct}.MintPoint = ${Struct}.Total / ${pointAmounts[i]};\n      ${Struct}.Voucher = ${isSelectVoucher};\n`;
                    ruleString += `}`;
                    rules = ruleString;
                }
                if (productConditions.attribute) {
                    let ruleString = `rule "${nameRuleEngine}" {\n`;
                    ruleString += `    when\n      ${Struct}.Attribute.Tag ${operator} "${productConditions.attribute.tag}" && ${Struct}.Attribute.Value ${operator} "${productConditions.attribute.value}" && ${Struct}.Currency == "${currency[i]}"\n`;
                    ruleString += `    then\n      ${Struct}.Result = "Condition met";\n      ${Struct}.MintPoint = ${Struct}.Total / ${pointAmounts[i]};\n      ${Struct}.Voucher = ${isSelectVoucher};\n`;
                    ruleString += `}`;
                    rules = ruleString;
                }
                break;
            case 'Customer':
                const customerConditions = conditions as CustomerConditions;
                if (customerConditions.tier) {
                    let ruleString = `rule "${nameRuleEngine}" {\n`;
                    ruleString += `    when\n      ${Struct}.Tier ${operator} "${customerConditions.tier} && ${Struct}.Currency == "${currency[i]}""\n`;
                    ruleString += `    then\n      ${Struct}.Result = "Condition met";\n      ${Struct}.MintPoint = ${Struct}.Total / ${pointAmounts[i]};\n      ${Struct}.Voucher = ${isSelectVoucher};\n`;
                    ruleString += `}`;
                    rules = ruleString;
                }
                if (customerConditions.registerDate) {
                    let ruleString = `rule "${nameRuleEngine}" {\n`;
                    ruleString += `    when\n      ${Struct}.RegisterDate.StartDate >= now() && ${Struct}.RegisterDate.EndDate <= now() && ${Struct}.Currency == "${currency[i]}"\n`;
                    ruleString += `    then\n      ${Struct}.Result = "Condition met";\n      ${Struct}.MintPoint = ${Struct}.Total / ${pointAmounts[i]};\n      ${Struct}.Voucher = ${isSelectVoucher};\n`;
                    ruleString += `}`;
                    rules = ruleString;
                }
                if (customerConditions.clv) {
                    let ruleString = `rule "${nameRuleEngine}" {\n`;
                    ruleString += `    when\n      ${Struct}.Clv ${operator} ${customerConditions.clv} && ${Struct}.Currency == "${currency[i]}"\n`;
                    ruleString += `    then\n      ${Struct}.Result = "Condition met";\n      ${Struct}.MintPoint = ${Struct}.Total / ${pointAmounts[i]};\n      ${Struct}.Voucher = ${isSelectVoucher};\n`;
                    ruleString += `}`;
                    rules = ruleString;
                }
                break;

            case 'Source':
                const sourceConditions = conditions as SourceConditions;
                if (sourceConditions.channels) {
                    let ruleString = `rule "${nameRuleEngine}" {\n`;
                    ruleString += `    when\n      ${Struct}.Channel ${operator} (${sourceConditions.channels.map(channel => `"${channel}"`).join(', ')}) && ${Struct}.Currency == "${currency[i]}"\n`;
                    ruleString += `    then\n      ${Struct}.Result = "Condition met";\n      ${Struct}.MintPoint = ${Struct}.Total / ${pointAmounts[i]};\n      ${Struct}.Voucher = ${isSelectVoucher};\n`;
                    ruleString += `}`;
                    rules = ruleString;
                }
                if (sourceConditions.storeId) {
                    let ruleString = `rule "${nameRuleEngine}" {\n`;
                    ruleString += `    when\n      ${Struct}.StoreId ${operator} "${sourceConditions.storeId}" && ${Struct}.Currency == "${currency[i]}"\n`;
                    ruleString += `    then\n      ${Struct}.Result = "Condition met";\n      ${Struct}.MintPoint = ${Struct}.Total / ${pointAmounts[i]};\n      ${Struct}.Voucher = ${isSelectVoucher};\n`;
                    ruleString += `}`;
                    rules = ruleString;
                }
                break;

            case 'Action':
                const actionConditions = conditions as ActionConditions;
                if (actionConditions.eventId) {
                    let ruleString = `rule "${nameRuleEngine}" {\n`;
                    ruleString += `    when\n      ${Struct}.EventId ${operator} "${actionConditions.eventId}" && ${Struct}.Currency == "${currency[i]}"\n`;
                    ruleString += `    then\n      ${Struct}.Result = "Condition met";\n      ${Struct}.MintPoint = ${Struct}.Total / ${pointAmounts[i]};\n      ${Struct}.Voucher = ${isSelectVoucher};\n`;
                    ruleString += `}`;
                    rules = ruleString;
                }
                if (actionConditions.referalCode) {
                    let ruleString = `rule "${nameRuleEngine}" {\n`;
                    ruleString += `    when\n      ${Struct}.ReferalCode ${operator} "${actionConditions.referalCode}" && ${Struct}.Currency == "${currency[i]}"\n`;
                    ruleString += `    then\n      ${Struct}.Result = "Condition met";\n      ${Struct}.MintPoint = ${Struct}.Total / ${pointAmounts[i]};\n      ${Struct}.Voucher = ${isSelectVoucher};\n`;
                    ruleString += `}`;
                    rules = ruleString;
                }
                if (actionConditions.gameId) {
                    let ruleString = `rule "${nameRuleEngine}" {\n`;
                    ruleString += `    when\n      ${Struct}.GameId ${operator} "${actionConditions.gameId}" && ${Struct}.currency == "${currency[i]}"\n`;
                    ruleString += `    then\n      ${Struct}.Result = "Condition met";\n      ${Struct}.MintPoint = ${Struct}.Total / ${pointAmounts[i]};\n      ${Struct}.Voucher = ${isSelectVoucher};\n`;
                    ruleString += `}`;
                    rules = ruleString;
                }
                if (actionConditions.missionId) {
                    let ruleString = `rule "${nameRuleEngine}" {\n`;
                    ruleString += `    when\n      ${Struct}.MissionId ${operator} "${actionConditions.missionId}" && ${Struct}.Currency == "${currency[i]}"\n`;
                    ruleString += `    then\n      ${Struct}.Result = "Condition met";\n      ${Struct}.MintPoint = ${Struct}.Total / ${pointAmounts[i]};\n      ${Struct}.Voucher = ${isSelectVoucher};\n`;
                    ruleString += `}`;
                    rules = ruleString;
                }
                break;
        }
        if (rules.length > 0) {
            const valueRuleAfterDecode: string = ruleEngineEncode(rules);
            listRules.push(valueRuleAfterDecode);
        }
    }
    return listRules;
}
