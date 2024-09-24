package main

import (
	"fmt"
	"regexp"
	"strconv"
	"strings"
)

func ensureFloat64(value string) string {
	if value == "" {
		return "0.0"
	}
	if strings.Contains(value, ".") {
		parts := strings.Split(value, ".")
		if len(parts[1]) == 0 {
			return value + "0"
		}
		return value
	}
	if _, err := strconv.Atoi(value); err == nil {
		return value + ".0"
	}
	return value
}

func transformProcessRewards(rule string) string {
	const regex = `processRewards\(Order, "(.*?)", \{(.*?)\}\)(;?)`
	re := regexp.MustCompile(regex)

	transformedRule := re.ReplaceAllStringFunc(rule, func(match string) string {
		subMatches := re.FindStringSubmatch(match)
		rewardType := subMatches[1]
		params := subMatches[2]

		paramMap := make(map[string]string)
		for _, param := range strings.Split(params, ",") {
			parts := strings.Split(param, ":")
			if len(parts) == 2 {
				paramMap[strings.TrimSpace(parts[0])] = strings.TrimSpace(parts[1])
			}
		}

		collectionId := paramMap["collectionId"]
		if collectionId == "" {
			collectionId = `""`
		} else {
			collectionId = fmt.Sprintf(`"%s"`, strings.ReplaceAll(collectionId, `"`, ""))
		}

		conversionRate := ensureFloat64(paramMap["conversionRate"])
		currency := paramMap["currency"]
		if currency == "" {
			currency = `""`
		} else {
			currency = fmt.Sprintf(`"%s"`, strings.ReplaceAll(currency, `"`, ""))
		}

		productId := paramMap["productId"]
		if productId == "" {
			productId = `""`
		}

		basedPoint := ensureFloat64(paramMap["basedPoint"])
		convertedDiscount := ensureFloat64(paramMap["convertedDiscount"])
		percentDiscount := ensureFloat64(paramMap["percentDiscount"])
		fixedDiscount := ensureFloat64(paramMap["fixedDiscount"])

		var result string
		if rewardType == "redeemVoucher" {
			result = fmt.Sprintf(`RewardProcessor.ProcessRewards(Order, "%s", %s, %s, %s, %s, %s, %s);`, rewardType, collectionId, fixedDiscount, currency, productId, basedPoint, percentDiscount)
		} else {
			result = fmt.Sprintf(`RewardProcessor.ProcessRewards(Order, "%s", %s, %s, %s, %s, %s, %s);`, rewardType, collectionId, conversionRate, currency, productId, basedPoint, convertedDiscount)
		}

		return result
	})

	return transformedRule
}

func main() {
	ruleFromFE := `
rule RuleWithMoreConditions "RuleWithMoreConditions" {
    when
        (Order.Total >= 100 ||
            Order.Attribute == "SDCDC" ||
            Order.PlaceOrderDate < 1726655565 && Order.PlaceOrderDate > 1726755565 ||
            Order.CheckSkuContains("SKU1") ||
            Order.CheckCategoryContains("Category1") && Order.CheckCategoryContains("Category2") ||
            Customer.Tier == "Tier1" ||
            Action.Event == "ABC123") == false
    then
        processRewards(Order, "redeemPoints", { conversionRate: 10, currency: "USD" });
        processRewards(Order, "redeemPoints", { basedPoint: 2, convertedDiscount: 10, currency: "USD" });
        processRewards(Order, "redeemPoints", { conversionRate: 0.01, productId: "A", currency: "USD" });
        processRewards(Order, "redeemPoints", { basedPoint: 2, convertedDiscount: 10, productId: "A", currency: "USD" });
        processRewards(Order, "redeemVoucher", { collectionId: 0xAAA, percentDiscount: 0.05, currency: "USD" });
        processRewards(Order, "redeemVoucher", { collectionId: 0xBBB, fixedDiscount: 100, currency: "USD" });
        processRewards(Order, "redeemVoucher", { collectionId: 0xCCC, percentDiscount: 0.05, productId: "A", currency: "USD" });
        processRewards(Order, "redeemVoucher", { collectionId: 0xDDD, fixedDiscount: 100, productId: "A", currency: "USD" });
        Retract("RuleWithMoreConditions");
}
`

	transformedRule := transformProcessRewards(ruleFromFE)
	fmt.Println("Rule đã chuyển đổi từ FE sang BE:")
	fmt.Println(transformedRule)
}
