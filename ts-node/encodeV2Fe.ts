interface Condition {
    field: string;
    operator: string;
    value: string | number | [string | number];
}

interface PointReward {
    conversionRate: number;
    basedPoint: number;
    convertedDiscount: number;
    productId: string;
    productName: string;
}

interface VoucherReward {
    collectionId: string;
    discountType: "percent" | "fixed";
    discountValue: number;
    selectProduct: string;
    productName: string;
}

interface RedemptionRuleInput {
    conditions: Condition[];
    points: PointReward[];
    vouchers: VoucherReward[];
}

function applyPointReward(index: number, point: PointReward): string {
    if (point.conversionRate > 0 && !point.productId) {
        return `processRewards(Order, "redeemPoints", ${index}, { conversionRate: ${point.conversionRate} })`;
    }
    if (point.conversionRate > 0 && point.productId) {
        return `processRewards(Order, "redeemPoints", ${index}, { conversionRate: ${point.conversionRate}, productId: "${point.productId}" })`;
    }
    if (point.conversionRate == 0 && !point.productId) {
        return `processRewards(Order, "redeemPoints", ${index}, { basedPoint: ${point.basedPoint}, convertedDiscount: ${point.convertedDiscount} })`;
    }
    if (point.conversionRate == 0 && point.productId) {
        return `processRewards(Order, "redeemPoints", ${index}, { basedPoint: ${point.basedPoint}, convertedDiscount: ${point.convertedDiscount}, productId: "${point.productId}" })`;
    }
    return '';
}

function applyVoucherReward(index: number, voucher: VoucherReward): string {
    if (voucher.productName.length > 0) {
        return `processRewards(Order, "redeemVouchers", ${index}, { collectionId: "${voucher.collectionId}", discountType: "${voucher.discountType}", discountValue: ${voucher.discountValue}, productId: "${voucher.selectProduct}", productName: "${voucher.productName}" })`;
    }
    return `processRewards(Order, "redeemVouchers", ${index}, { collectionId: "${voucher.collectionId}", discountType: "${voucher.discountType}", discountValue: ${voucher.discountValue}, productId: "${voucher.selectProduct}" })`;
}

function generateRuleEngine(ruleName: string, input: RedemptionRuleInput) {
    const conditionStatements = input.conditions.map(condition => {
        if (Array.isArray(condition.value)) {
            const values = condition.value.map(v => `"${v}"`).join(', ');
            if (condition.operator === "between") {
                return `Order.${condition.field} >= "${condition.value[0]}" && Order.${condition.field} <= "${condition.value[1]}"`;
            }
            return `Order.${condition.field} in [${values}]`;
        }
        return `Order.${condition.field} ${condition.operator} ${typeof condition.value === 'string' ? `"${condition.value}"` : condition.value}`;
    }).join(' &&\n            ');

    const pointStatements = input.points.map((point, index) => applyPointReward(index, point)).join(';\n            ');

    const voucherStatements = input.vouchers
        .filter(voucher => voucher.productName.length === 0)
        .map((voucher, index) => applyVoucherReward(index, voucher)).join(';\n            ');

    const productNameRules = input.vouchers
        .filter(voucher => voucher.productName.length > 0)
        .map((voucher, index) => {
            const productCondition = `Helper.Contains(Order.Products[0].ProductName, "${voucher.productName}")`;
            return `rule ${ruleName}_${voucher.productName} "${ruleName} for ${voucher.productName}" {
        when
            (${conditionStatements} && ${productCondition}) == true
        then
            ${applyVoucherReward(index, voucher)};
            Retract("${ruleName}_${voucher.productName}");
    }`;
        });

    return `rule ${ruleName} "${ruleName}" {
        when
            (${conditionStatements}) == true
        then
            ${pointStatements};
            ${voucherStatements};
            Retract("${ruleName}");
    }
    ${productNameRules.join('\n\n    ')}`;
}

const ruleInput: RedemptionRuleInput = {
    conditions: [
        { field: 'Total', operator: '>=', value: 100 },
        { field: 'Amount', operator: '>=', value: 2 },
        { field: 'PlaceOrderDate', operator: 'between', value: ['2023-01-01', '2023-12-31'] }
    ],
    points: [
        { conversionRate: 10, basedPoint: 0, convertedDiscount: 0, productId: "", productName: "" },
        { conversionRate: 0, basedPoint: 2, convertedDiscount: 10, productId: "", productName: "" },
        { conversionRate: 0.01, basedPoint: 0, convertedDiscount: 0, productId: "A", productName: "" },
        { conversionRate: 0, basedPoint: 2, convertedDiscount: 10, productId: "A", productName: "" }
    ],
    vouchers: [
        { collectionId: "0xAAA", discountType: "percent", discountValue: 5, selectProduct: "", productName: "" },
        { collectionId: "0xBBB", discountType: "fixed", discountValue: 100, selectProduct: "", productName: "" },
        { collectionId: "0xCCC", discountType: "percent", discountValue: 5, selectProduct: "A", productName: "Iphone1" },
        { collectionId: "0xDDD", discountType: "fixed", discountValue: 100, selectProduct: "A", productName: "Iphone2" }
    ]
};

// Generate rule engine
const ruleEngine = generateRuleEngine("RuleWithMoreConditions", ruleInput);

console.log(ruleEngine);
