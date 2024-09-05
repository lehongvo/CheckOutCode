export const genEncodedRedempConditions = ({
    ruleName,
    Struct,
    conditions,
    operator,
    pointReward,
    voucherReward,
    startTime,
    endTime,
}) => {
    const formattedName = ruleName.replace(/[^a-zA-Z0-9]/g, '_');

    const generateRuleString = (type, value) => `rule "${formattedName}" {
        when
          ${type !== '' ? `${Struct}.${type} ${operator} ` : ''}${value}
        then
          Cart.Result = "Condition met";
          Cart.MintPoint = ${JSON.stringify(pointReward)};
          Cart.Voucher = ${JSON.stringify(voucherReward)};
          Retract("${formattedName}");
    }`;

    let rule = '';
    switch (Struct) {
        case 'Cart':
            const cartConditions = conditions;
            if (cartConditions.total) {
                rule += generateRuleString('Total', cartConditions.total);
            }
            if (cartConditions.amount) {
                rule += generateRuleString('Amount', cartConditions.amount);
            }
            if (cartConditions.placeOrderDate) {
                rule += generateRuleString(
                    '',
                    `${startTime} <= ${Struct}.PlaceOrderDate && ${endTime} >= ${Struct}.PlaceOrderDate`,
                );
            }
            break;

        case 'Product':
            const productConditions = conditions;
            if (productConditions.sku) {
                rule += generateRuleString('Sku', `"${productConditions.sku}"`);
            }
            if (productConditions.skus) {
                rule += generateRuleString(
                    'Sku',
                    `(${productConditions.skus.map((sku) => `"${sku}"`).join(', ')})`,
                );
            }
            if (productConditions.category) {
                rule += generateRuleString(
                    'Category',
                    `"${productConditions.category}"`,
                );
            }
            if (productConditions.categories) {
                rule += generateRuleString(
                    'Category',
                    `(${productConditions.categories
                        .map((cat) => `"${cat}"`)
                        .join(', ')})`,
                );
            }
            if (productConditions.attribute) {
                rule += generateRuleString(
                    'Attribute.Tag',
                    `"${productConditions.attribute.tag}"`,
                );
            }
            break;

        case 'Customer':
            const customerConditions = conditions;
            if (customerConditions.tier) {
                rule += generateRuleString('Tier', `"${customerConditions.tier}"`);
            }
            if (customerConditions.registerDate) {
                rule += generateRuleString(
                    '',
                    `${startTime} <= ${Struct}.RegisterDate && ${endTime} >= ${Struct}.RegisterDate`,
                );
            }
            if (customerConditions.clv) {
                rule += generateRuleString('Clv', customerConditions.clv);
            }
            if (customerConditions.birthday) {
                rule += generateRuleString('Birthday', customerConditions.birthday);
            }
            break;

        case 'Source':
            const sourceConditions = conditions;
            if (sourceConditions.channel) {
                rule += generateRuleString(
                    'Channel',
                    `(${sourceConditions.channels
                        .map((channel) => `"${channel}"`)
                        .join(', ')})`,
                );
            }
            if (sourceConditions.storeId) {
                rule += generateRuleString('StoreId', `"${sourceConditions.storeId}"`);
            }
            break;

        case 'Action':
            const actionConditions = conditions;
            if (actionConditions.eventId) {
                rule += generateRuleString('EventId', `"${actionConditions.eventId}"`);
            }
            if (actionConditions.referalCode) {
                rule += generateRuleString(
                    'ReferalCode',
                    `"${actionConditions.referalCode}"`,
                );
            }
            if (actionConditions.gameId) {
                rule += generateRuleString('GameId', `"${actionConditions.gameId}"`);
            }
            if (actionConditions.missionId) {
                rule += generateRuleString(
                    'MissionId',
                    `"${actionConditions.missionId}"`,
                );
            }
            break;

        default:
            break;
    }

    return ruleEngineEncode(rule);
};