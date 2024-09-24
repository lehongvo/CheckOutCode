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
    conditionKey: ConditionKey;
    conditionStatus: boolean;
}

enum ConditionKey {
    ALL = 'all',
    ANY = 'any'
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
        return `processRewards(Order, "redeemVoucher", { collectionId: ${voucher.collectionId}, percentDiscount: ${voucher.percentDiscount}, currency: "${voucher.currency}" })`;
    }

    if (voucher.percentDiscount == 0 && voucher.fixedDiscount > 0 && voucher.productId.length == 0) {
        return `processRewards(Order, "redeemVoucher", { collectionId: ${voucher.collectionId}, fixedDiscount: ${voucher.fixedDiscount}, currency: "${voucher.currency}" })`;
    }

    if (voucher.percentDiscount > 0 && voucher.fixedDiscount == 0 && voucher.productId.length >= 0) {
        return `processRewards(Order, "redeemVoucher", { collectionId: ${voucher.collectionId}, percentDiscount: ${voucher.percentDiscount}, productId: "${voucher.productId}", currency: "${voucher.currency}" })`;
    }

    if (voucher.percentDiscount == 0 && voucher.fixedDiscount > 0 && voucher.productId.length >= 0) {
        return `processRewards(Order, "redeemVoucher", { collectionId: ${voucher.collectionId},  fixedDiscount: ${voucher.fixedDiscount}, productId: "${voucher.productId}", currency: "${voucher.currency}" })`;
    }
}

function ruleEngineEncode(ruleText: string): string {
    return Buffer.from(ruleText).toString('base64');
}


function generateRuleEngine(ruleName: string, input: RedemptionRuleInput) {
    const conditionOperator = input.conditionKey === ConditionKey.ALL ? '&&' : '||';
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

        // Check for arrays in SKU or Category
        if (Array.isArray(condition.value)) {
            const values = condition.value.map(v => `"${v}"`);
            if (
                condition.field == 'RegisterDate' && condition.value.length == 1 ||
                condition.field == 'PlaceOrderDate' && condition.value.length == 1 ||
                condition.field == 'Birthday' && condition.value.length == 1
            ) {
                return `${structNameValue}.${condition.field} ${condition.operator} ${condition.value[0]}`;
            }
            if (condition.operator == 'in') {
                if (condition.field == 'PlaceOrderDate' || condition.field == 'RegisterDate' || condition.field == 'Birthday') {
                    return `${structNameValue}.${condition.field} >= ${condition.value[0]} && ${structNameValue}.${condition.field} <= ${condition.value[1]}`;
                }
                if (condition.field === 'SKU') {
                    return values.map(v => `${structNameValue}.CheckSkuContains(${v})`).join(' || ');
                } else if (condition.field === 'Category') {
                    return values.map(v => `${structNameValue}.CheckCategoryContains(${v})`).join(' || ');
                } else {
                    if (condition.field === 'Event') {
                        return values.map(v => `${structNameValue}.CheckEventContains(${v})`).join(' || ');
                    } else {
                        if (condition.field === 'Source') {
                            return values.map(v => `${structNameValue}.CheckSourceContains(${v})`).join(' || ');
                        } else {
                            if (condition.field == 'Channel') {
                                return values.map(v => `${structNameValue}.CheckChannelContains(${v})`).join(' || ');
                            } else {
                                if (condition.field == 'Referral') {
                                    return values.map(v => `${structNameValue}.CheckReferralContains(${v})`).join(' || ');
                                } else {
                                    if (condition.field == 'Game') {
                                        return values.map(v => `${structNameValue}.CheckGameContains(${v})`).join(' || ');
                                    } else {
                                        if (condition.field == 'Mission') {
                                            return values.map(v => `${structNameValue}.CheckMissionContains(${v})`).join(' || ');
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            if (condition.operator == "not in") {
                if (condition.field == 'SKU') {
                    return values.map(v => `${structNameValue}.CheckSkuContains(${v}) == false`).join(' && ');
                }
                if (condition.field == 'Category') {
                    return values.map(v => `${structNameValue}.CheckCategoryContains(${v}) == false`).join(' && ');
                }
                if (condition.field == 'Event') {
                    return values.map(v => `${structNameValue}.CheckEventContains(${v}) == false`).join(' && ');
                }
                if (condition.field == 'Source') {
                    return values.map(v => `${structNameValue}.CheckSourceContains(${v}) == false`).join(' && ');
                }
                if (condition.field == 'Channel') {
                    return values.map(v => `${structNameValue}.CheckChannelContains(${v}) == false`).join(' && ');
                }
                if (condition.field == 'Referral') {
                    return values.map(v => `${structNameValue}.CheckReferralContains(${v}) == false`).join(' && ');
                }
                if (condition.field == 'Game') {
                    return values.map(v => `${structNameValue}.CheckGameContains(${v}) == false`).join(' && ');
                }
                if (condition.field == 'Mission') {
                    return values.map(v => `${structNameValue}.CheckMissionContains(${v}) == false`).join(' && ');
                }
                return `${structNameValue}.${condition.field} < ${condition.value[0]} && ${structNameValue}.${condition.field} > ${condition.value[1]}`;
            }

            if (condition.operator == "!=") {
                if (condition.field == 'SKU') {
                    return values.map(v => `${structNameValue}.CheckSkuContains(${v}) == false`).join(' && ');
                }
                if (condition.field == 'Category') {
                    return values.map(v => `${structNameValue}.CheckCategoryContains(${v}) == false`).join(' && ');
                }
            }
            return `${structNameValue}.${condition.field} ${condition.operator} [${values.join(', ')}]`;
        }
        if (condition.operator == "not in" || condition.operator == "in") {
            const valueAble = condition.operator == "not in" ? "!=" : "==";
            return `${structNameValue}.${condition.field} ${valueAble} ${typeof condition.value === 'string' ? `"${condition.value}"` : condition.value}`;
        } else {
            return `${structNameValue}.${condition.field} ${condition.operator} ${typeof condition.value === 'string' ? `"${condition.value}"` : condition.value}`;
        }
    }).join(` ${conditionOperator}\n            `);

    const pointStatements = input.points.map((point, index) => applyPointReward(index, point)).join(';\n            ');

    const voucherStatements = input.vouchers.map((voucher, index) => applyVoucherReward(index, voucher)).join(';\n            ');

    let encodeValue = ""
    if (input.conditions.length == 0) {
        encodeValue = `rule ${ruleName} "${ruleName}" {
    when
        true
    then
        ${pointStatements};
        ${voucherStatements};
        Retract("${ruleName}");
}
`;
    } else {
        encodeValue = `rule ${ruleName} "${ruleName}" {
    when
        (${conditionStatements}) == ${input.conditionStatus}
    then
        ${pointStatements};
        ${voucherStatements}
        Retract("${ruleName}");
}
`;
        console.log(encodeValue);
        return ruleEngineEncode(encodeValue);
    }
}

const ruleInput: RedemptionRuleInput = {
    conditions: [
        { field: "SKU", operator: "in", value: ["SKU1", "SKU2", "SKU3"] },
        // { field: 'Total', operator: '>=', value: 100 },
        // { field: '≈', operator: '==', value: [1726765200] },
        // { field: 'PlaceOrderDate', operator: 'not in', value: [1726655565, 1726755565] },
        // { field: 'SKU', operator: 'in', value: ["SKU1"] },
        // { field: 'Category', operator: 'not in', value: ["Category1", "Category2"] },
        // { field: 'Tier', operator: '==', value: "Tier1" },
        // { field: 'Event', operator: '==', value: "ABC123" },
        // {
        //     "field": "Birthday",
        //     "operator": "in",
        //     "value": [
        //         1727024400,
        //         1727110800
        //     ]
        // },
        // {
        //     "field": "RegisterDate",
        //     "operator": "in",
        //     "value": [
        //         1726851600,
        //         1726938000
        //     ]
        // },
        // {
        //     "field": "Event",
        //     "operator": "in",
        //     "value": [
        //         "EVENT1",
        //         "EVENT2",
        //         "EVENT3"
        //     ]
        // }
        // {
        //     field: 'Mission',
        //     operator: 'in',
        //     value: 'MISS1 Miss2',
        // },

    ],
    points: [
        { conversionRate: 10, basedPoint: 0, convertedDiscount: 0, productId: "", currency: "USD" },
        { conversionRate: 0, basedPoint: 2, convertedDiscount: 10, productId: "", currency: "USD" },
        { conversionRate: 0.01, basedPoint: 0, convertedDiscount: 0, productId: "A", currency: "USD" },
        { conversionRate: 0, basedPoint: 2, convertedDiscount: 10, productId: "A", currency: "USD" }
    ],
    vouchers: [
        { collectionId: "0xAAA", percentDiscount: 0.05, fixedDiscount: 0, productId: "", currency: "USD" },
    ],
    conditionKey: ConditionKey.ALL,
    conditionStatus: true
};

const ruleEngine = generateRuleEngine("RuleWithMoreConditions", ruleInput);
console.log(ruleEngine);