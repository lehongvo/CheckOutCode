import {
    SKU,
    Category,
    Tier,
    Channel,
    ConditionType,
    CartConditions,
    ProductConditions,
    CustomerConditions,
    SourceConditions,
    ActionConditions,
    genNewRules,
    Currency
} from './interface';

export function createAndExecuteRule(
    nameRuleEngine: string,
    structType: 'Cart' | 'Product' | 'Customer' | 'Source' | 'Action',
    specificConditions: any,
    pointAmounts: number[],
    isSelectVoucher: boolean,
    conditionType: ConditionType,
    currency: Currency[]
) {
    let conditions: any;

    switch (structType) {
        case 'Cart':
            conditions = specificConditions as CartConditions;
            break;
        case 'Product':
            conditions = specificConditions as ProductConditions;
            break;
        case 'Customer':
            conditions = specificConditions as CustomerConditions;
            break;
        case 'Source':
            conditions = specificConditions as SourceConditions;
            break;
        case "Action":
            conditions = specificConditions as ActionConditions;
            break;
    }

    const rules = genNewRules(nameRuleEngine, structType, conditions, pointAmounts, isSelectVoucher, conditionType, currency);
    console.log(`${rules}`);
    console.log(`======================================${structType}======================================`);
    return rules;
}

// Cart Examples

// // Example 1: Cart - Total >= <Number>
const cartConditionsTotal: CartConditions = {
    total: 500
};
const role = createAndExecuteRule(
    "Cart - Total",
    'Cart',
    cartConditionsTotal,
    [1000],
    true,
    ConditionType.EQUALS_OR_GREATER_THAN,
    [Currency.USD]
);

// Example 2: Cart - Amount >= <Number>
const cartConditionsAmount: CartConditions = {
    amount: 300
};
const role1 = createAndExecuteRule(
    "Cart - Amount",
    'Cart',
    cartConditionsAmount,
    [1000],
    true,
    ConditionType.EQUALS_OR_GREATER_THAN,
    [Currency.USD]
);

// Example 3: Cart - Place Order Date between StartDate & EndDate
const cartConditionsPlaceOrderDate: CartConditions = {
    placeOrderDate: {
        startDate: '2024-08-01',
        endDate: '2024-08-31'
    }
};
createAndExecuteRule(
    "Cart - Place Order",
    'Cart',
    cartConditionsPlaceOrderDate,
    [1000],
    true,
    ConditionType.IS,
    [Currency.EUR]
);

// Product Examples

// Example 4: Product - SKU = "SKU1"
const productConditionsSKU: ProductConditions = {
    sku: SKU.SKU1
};
createAndExecuteRule(
    "Product - SKU",
    'Product',
    productConditionsSKU,
    [500], false, ConditionType.IS, [Currency.THB]);

// Example 5: Product - SKU in (SKU1, SKU2, SKU3)
const productConditionsSKUs: ProductConditions = {
    skus: [SKU.SKU1, SKU.SKU2, SKU.SKU3]
};
createAndExecuteRule(
    "Product - SKU",
    'Product', productConditionsSKUs, [500], true, ConditionType.IS_ONE_OF, [Currency.USD]);

// Example 6: Product - Category = "Category 1"
const productConditionsCategory: ProductConditions = {
    category: Category.Category1
};
createAndExecuteRule("Product - Category", 'Product', productConditionsCategory, [500], false, ConditionType.IS, [Currency.VND]);

// Example 7: Product - Category in (Category 1, Category 2, Category 3)
const productConditionsCategories: ProductConditions = {
    categories: [Category.Category1, Category.Category2, Category.Category3]
};
createAndExecuteRule("Product - Category", 'Product', productConditionsCategories, [500], true, ConditionType.IS_ONE_OF, [Currency.EUR]);

// Example 8: Product - Attribute Tag = "Value 1"
const productConditionsAttribute: ProductConditions = {
    attribute: {
        tag: "Tag1",
        value: "Value 1"
    }
};
createAndExecuteRule("Product - Attribute Tag", 'Product', productConditionsAttribute, [500], false, ConditionType.IS, [Currency.THB]);

// Customer Examples
// Example 9: Customer - Tier = Tier 1
const customerConditionsTier: CustomerConditions = {
    tier: Tier.Tier1
};
createAndExecuteRule("Customer - Tier", 'Customer', customerConditionsTier, [2000], false, ConditionType.IS, [Currency.USD]);

// Example 10: Customer - Register Date between StartDate & EndDate
const customerConditionsRegisterDate: CustomerConditions = {
    registerDate: {
        startDate: '2024-01-01',
        endDate: '2024-12-31'
    }
};
createAndExecuteRule("Customer - Register", 'Customer', customerConditionsRegisterDate, [1500], true, ConditionType.IS, [Currency.VND]);

// Example 11: Customer - CLV >= "CLV 1"
const customerConditionsCLV: CustomerConditions = {
    clv: 1000
};
createAndExecuteRule("Customer - CLV", 'Customer', customerConditionsCLV, [1500], true, ConditionType.EQUALS_OR_GREATER_THAN, [Currency.EUR]);

// Source Examples

// Example 12: Source - Channel in (Online, Offline, Marketplace, Partner)
const sourceConditionsChannels: SourceConditions = {
    channels: [Channel.Online, Channel.Offline, Channel.Marketplace, Channel.Partner]
};
createAndExecuteRule("Source - Channel", 'Source', sourceConditionsChannels, [3000], true, ConditionType.IS_ONE_OF, [Currency.THB]);

// Example 13: Source - StoreID = "Store123"
const sourceConditionsStoreId: SourceConditions = {
    storeId: 'Store123'
};
createAndExecuteRule("Source - StoreID", 'Source', sourceConditionsStoreId, [3000], false, ConditionType.IS, [Currency.VND]);

// Action Examples

// Example 14: Action - Event = Event ID
const actionConditionsEventId: ActionConditions = {
    eventId: 'Event456'
};
createAndExecuteRule("Action - Event", 'Action', actionConditionsEventId, [800], true, ConditionType.IS, [Currency.USD]);

// Example 15: Action - Referral = Referral Code
const actionConditionsReferralCode: ActionConditions = {
    referalCode: 'ReferalCode123'
};
createAndExecuteRule("Action - Referral", 'Action', actionConditionsReferralCode, [800], false, ConditionType.IS, [Currency.VND]);

// Example 16: Action - Game = Game ID
const actionConditionsGameId: ActionConditions = {
    gameId: 'Game789'
};
createAndExecuteRule("Action - Game", 'Action', actionConditionsGameId, [1000], true, ConditionType.IS, [Currency.EUR]);

// Example 17: Action - Mission = Mission ID
const actionConditionsMissionId: ActionConditions = {
    missionId: 'Mission001'
};
createAndExecuteRule("Action - Mission", 'Action', actionConditionsMissionId, [1200], true, ConditionType.IS, [Currency.THB]);
