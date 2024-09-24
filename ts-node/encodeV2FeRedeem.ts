interface Condition {
    field: string;
    operator: string;
    value: string | number | [string | number] | any[];
}

interface PointRewardEarnRule {
    conversionRate: number;
    fixedPoint: number;
    basedAmount: number;
    basedPoint: number;
    productId: string;
    currency: string;
}

interface VoucherRewardEarnRule {
    collectionId: string;
}

interface EarnRuleInput {
    conditions: Condition[];
    points: PointRewardEarnRule[];
    vouchers: VoucherRewardEarnRule[];
    conditionKey: ConditionKey;
    conditionStatus: boolean;
}

enum ConditionKey {
    ALL = 'all',
    ANY = 'any'
}

function applyPointReward(index: number, point: PointRewardEarnRule): string {
    if (point.conversionRate > 0 && point.productId.length == 0) {
        return `processRewards(Order, "earningPoints", { ConversionRate: ${point.conversionRate}, currency: "${point.currency}" })`;
    }

    if (point.conversionRate > 0 && point.productId.length > 0) {
        return `processRewards(Order, "earningPoints", { ConversionRate: ${point.conversionRate}, productId: "${point.productId}", currency: "${point.currency}" })`;
    }

    if (point.fixedPoint > 0 && point.productId.length == 0) {
        return `processRewards(Order, "earningPoints", { FixedPoint: ${point.fixedPoint}, currency: "${point.currency}" })`;
    }

    if (point.fixedPoint > 0 && point.productId.length > 0) {
        return `processRewards(Order, "earningPoints", { FixedPoint: ${point.fixedPoint}, productId: "${point.productId}", currency: "${point.currency}" })`;
    }

    if (point.basedAmount > 0 && point.basedPoint > 0 && point.productId.length == 0) {
        return `processRewards(Order, "earningPoints", { BasedAmount: ${point.basedAmount}, BasedPoint: ${point.basedPoint}, currency: "${point.currency}" })`;
    }

    if (point.basedAmount > 0 && point.basedPoint > 0 && point.productId.length > 0) {
        return `processRewards(Order, "earningPoints", { BasedAmount: ${point.basedAmount}, BasedPoint: ${point.basedPoint}, productId: "${point.productId}", currency: "${point.currency}" })`;
    }

    return '';
}

function applyVoucherReward(index: number, voucher: VoucherRewardEarnRule): string {
    if (voucher.collectionId.length > 0) {
        return `processRewards(Order, "earningVouchers", { CollectionId: "${voucher.collectionId}" })`;
    }
}

function ruleEngineEncode(ruleText: string): string {
    return Buffer.from(ruleText).toString('base64');
}

function generateRuleEngine(ruleName: string, input: EarnRuleInput) {
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
                    return values.map(v => `${structNameValue}.CheckSkuContains(${v})`).join(' && ');
                } else if (condition.field === 'Category') {
                    return values.map(v => `${structNameValue}.CheckCategoryContains(${v})`).join(' && ');
                } else {
                    if (condition.field === 'Event') {
                        return values.map(v => `${structNameValue}.CheckEventContains(${v})`).join(' && ');
                    } else {
                        if (condition.field === 'Source') {
                            return values.map(v => `${structNameValue}.CheckSourceContains(${v})`).join(' && ');
                        } else {
                            if (condition.field == 'Channel') {
                                return values.map(v => `${structNameValue}.CheckChannelContains(${v})`).join(' && ');
                            } else {
                                if (condition.field == 'Referral') {
                                    return values.map(v => `${structNameValue}.CheckReferralContains(${v})`).join(' && ');
                                } else {
                                    if (condition.field == 'Game') {
                                        return values.map(v => `${structNameValue}.CheckGameContains(${v})`).join(' && ');
                                    } else {
                                        if (condition.field == 'Mission') {
                                            return values.map(v => `${structNameValue}.CheckMissionContains(${v})`).join(' && ');
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
        ${voucherStatements}
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

const ruleInput: EarnRuleInput = {
    conditions: [
        { field: 'Total', operator: '>=', value: 100 },
        { field: 'PlaceOrderDate', operator: 'not in', value: [1726655565, 1726755565] },
        { field: 'Channel', operator: 'in', value: ["Offline"] },
        { field: 'Source', operator: 'in', value: ["London1"] },
        { field: "SKU", operator: "in", value: ["SKU1, SKU2, SKU3"] },
    ],
    points: [
        { conversionRate: 10, fixedPoint: 0, basedAmount: 0, basedPoint: 0, productId: "", currency: "USD" },
        { conversionRate: 0, fixedPoint: 20, basedAmount: 0, basedPoint: 0, productId: "", currency: "USD" },
        { conversionRate: 0, fixedPoint: 0, basedAmount: 10, basedPoint: 3, productId: "", currency: "USD" },
        { conversionRate: 0.01, fixedPoint: 0, basedAmount: 0, basedPoint: 0, productId: "A", currency: "USD" },
        { conversionRate: 0, fixedPoint: 20, basedAmount: 0, basedPoint: 0, productId: "B", currency: "USD" },
        { conversionRate: 0, fixedPoint: 0, basedAmount: 10, basedPoint: 3, productId: "C", currency: "USD" },
    ],
    vouchers: [
        { collectionId: "0xAAA" }
    ],
    conditionKey: ConditionKey.ALL,
    conditionStatus: true
};

const ruleEngine = generateRuleEngine("RuleWithMoreConditions", ruleInput);
console.log(ruleEngine);