interface Condition {
    field: string;
    operator: string;
    value: string | number | [string | number] | any[];
}

interface PointReward {
    conversionRate: number;
    basedPoint: number;
    convertedDiscount: number;
    productId: string;
    currency: string;
}

interface VoucherReward {
    collectionId: string;
    percentDiscount: number;
    fixedDiscount: number;
    productId: string;
    currency: string;
}

interface RedemptionRuleInput {
    conditions: Condition[];
    points: PointReward[];
    vouchers: VoucherReward[];
}

function applyPointReward(index: number, point: PointReward): string {
    if (point.conversionRate > 0 && !point.productId) {
        return `processRewards(Order, "redeemPoints", { conversionRate: ${point.conversionRate}, currency: "${point.currency}" })`;
    }
    if (point.conversionRate > 0 && point.productId) {
        return `processRewards(Order, "redeemPoints", { conversionRate: ${point.conversionRate}, productId: "${point.productId}", currency: "${point.currency}" })`;
    }
    if (point.conversionRate == 0 && !point.productId) {
        return `processRewards(Order, "redeemPoints", { basedPoint: ${point.basedPoint}, convertedDiscount: ${point.convertedDiscount}, currency: "${point.currency}" })`;
    }
    if (point.conversionRate == 0 && point.productId) {
        return `processRewards(Order, "redeemPoints", { basedPoint: ${point.basedPoint}, convertedDiscount: ${point.convertedDiscount}, productId: "${point.productId}", currency: "${point.currency}" })`;
    }
    return '';
}

function applyVoucherReward(index: number, voucher: VoucherReward): string {
    if (voucher.percentDiscount > 0 && voucher.fixedDiscount == 0 && voucher.productId.length == 0) {
        return `processRewards(Order, "redeemVoucher", { percentDiscount: ${voucher.percentDiscount}, currency: "${voucher.currency}" })`;
    }

    if (voucher.percentDiscount == 0 && voucher.fixedDiscount > 0 && voucher.productId.length == 0) {
        return `processRewards(Order, "redeemVoucher", { fixedDiscount: ${voucher.fixedDiscount}, currency: "${voucher.currency}" })`;
    }

    if (voucher.percentDiscount > 0 && voucher.fixedDiscount == 0 && voucher.productId.length >= 0) {
        return `processRewards(Order, "redeemVoucher", { percentDiscount: ${voucher.percentDiscount}, productId: "${voucher.productId}", currency: "${voucher.currency}" })`;
    }

    if (voucher.percentDiscount == 0 && voucher.fixedDiscount > 0 && voucher.productId.length >= 0) {
        return `processRewards(Order, "redeemVoucher", { fixedDiscount: ${voucher.fixedDiscount}, productId: "${voucher.productId}", currency: "${voucher.currency}" })`;
    }
}

function generateRuleEngine(ruleName: string, input: RedemptionRuleInput) {
    const conditionStatements = input.conditions.map(condition => {
        let structNameValue = "Order";
        if (
            condition.field == 'Tier' ||
            condition.field == 'RegisterDate' ||
            condition.field == 'Birthday' ||
            condition.field == 'CLV'
        ) {
            structNameValue = "Customer";
        }

        if (
            condition.field == 'Event' ||
            condition.field == 'Referral' ||
            condition.field == 'Game' ||
            condition.field == 'Mission'
        ) {
            structNameValue = "Action";
        }
        if (Array.isArray(condition.value)) {
            const values = condition.value.map(v => `"${v}"`).join(', ');
            if (condition.operator === 'in') {
                if (condition.field == 'PlaceOrderDate') {
                    return `${structNameValue}.${condition.field} >= ${condition.value[0]} && ${structNameValue}.${condition.field} <= ${condition.value[1]}`;
                }
                if (condition.field === 'SKU') {
                    return `${structNameValue}.CheckSkuContains([${values}])`;
                } else {
                    return `${structNameValue}.CheckCategoryContains([${values}])`;
                }
            }
            return `${structNameValue}.${condition.field} in [${values}]`;
        }
        return `${structNameValue}.${condition.field} ${condition.operator} ${typeof condition.value === 'string' ? `"${condition.value}"` : condition.value}`;
    }).join(' &&\n            ');

    const pointStatements = input.points.map((point, index) => applyPointReward(index, point)).join(';\n            ');

    const voucherStatements = input.vouchers.map((voucher, index) => applyVoucherReward(index, voucher)).join(';\n            ');

    return `rule ${ruleName} "${ruleName}" {
        when
            (${conditionStatements}) == true
        then
            ${pointStatements};
            ${voucherStatements}
            Retract("${ruleName}");
    }
    `;
}

const ruleInput: RedemptionRuleInput = {
    conditions: [
        { field: 'Total', operator: '>=', value: 100 },
        { field: 'Amount', operator: '>=', value: 2 },
        // { field: 'PlaceOrderDate', operator: 'in', value: [1726655565, 1726755565] },
        // { field: 'SKU', operator: 'in', value: ["SKU1"] },
        // { field: 'Category', operator: 'in', value: ["Category1", "Category2"] },
        // { field: 'Tier', operator: '==', value: "Tier1" },
        // { field: 'Event', operator: '==', value: "ABC123" }
    ],
    points: [
        { conversionRate: 10, basedPoint: 0, convertedDiscount: 0, productId: "", currency: "USD" },
        { conversionRate: 0, basedPoint: 2, convertedDiscount: 10, productId: "", currency: "USD" },
        { conversionRate: 0.01, basedPoint: 0, convertedDiscount: 0, productId: "A", currency: "USD" },
        { conversionRate: 0, basedPoint: 2, convertedDiscount: 10, productId: "A", currency: "USD" }
    ],
    vouchers: [
        { collectionId: "0xAAA", percentDiscount: 0.05, fixedDiscount: 0, productId: "", currency: "USD" },
        { collectionId: "0xBBB", percentDiscount: 0, fixedDiscount: 100, productId: "", currency: "USD" },
        { collectionId: "0xCCC", percentDiscount: 0.05, fixedDiscount: 0, productId: "A", currency: "USD" },
        { collectionId: "0xDDD", percentDiscount: 0, fixedDiscount: 100, productId: "A", currency: "USD" }
    ]
};

const ruleEngine = generateRuleEngine("RuleWithMoreConditions", ruleInput);

console.log(ruleEngine);