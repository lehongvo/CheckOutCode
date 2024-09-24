package main

import (
	"encoding/base64"
	"fmt"
	"log"
	"regexp"
	"strconv"
	"strings"

	"github.com/hyperjumptech/grule-rule-engine/ast"
	"github.com/hyperjumptech/grule-rule-engine/builder"
	"github.com/hyperjumptech/grule-rule-engine/engine"
	"github.com/hyperjumptech/grule-rule-engine/pkg"
)

var rewardResults []map[string]interface{}

type Channel string

const (
	Offline Channel = "Offline"
	Online  Channel = "Online"
)

type Product struct {
	SKU      string
	Category string
	Price    float64
	Quantity int
	Currency string
}

type Order struct {
	Total               float64
	Amount              int
	PlaceOrderDate      int64
	Tier                string
	Channels            []Channel
	Source              string
	Currency            string
	CLV                 float64
	Products            []*Product
	SkuCheckResult      bool
	CategoryCheckResult bool
}

type Customer struct {
	Tier string
}

type Action struct {
	Event string
}

type RewardProcessor struct{}

func (rp *RewardProcessor) ProcessRewards(order *Order, rewardType string, collectionId string, conversionRate float64, currency string, productId string, basedPoint float64, convertedDiscount float64) {
	result := map[string]interface{}{
		"order":        order,
		"rewardType":   rewardType,
		"collectionId": collectionId,
		"currency":     currency,
	}

	if conversionRate != 0 {
		result["conversionRate"] = conversionRate
	}
	if productId != "" {
		result["productId"] = productId
	}
	if basedPoint != 0 {
		result["basedPoint"] = basedPoint
	}
	if convertedDiscount != 0 {
		result["convertedDiscount"] = convertedDiscount
	}

	rewardResults = append(rewardResults, result)
}

func (o *Order) CheckSkuContains(skus ...string) bool {
	for _, sku := range skus {
		for _, product := range o.Products {
			if product.SKU == sku {
				return true
			}
		}
	}
	return false
}

func (o *Order) CheckCategoryContains(categories ...string) bool {
	for _, category := range categories {
		for _, product := range o.Products {
			if product.Category == category {
				return true
			}
		}
	}
	return false
}

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

func ruleEngineDecode(encodedRule string) (string, error) {
	decodedBytes, err := base64.StdEncoding.DecodeString(encodedRule)
	if err != nil {
		return "", err
	}
	return string(decodedBytes), nil
}

func executeRule(order *Order, customer *Customer, action *Action, ruleDataEncode string) error {
	ruleData, errDecode := ruleEngineDecode(ruleDataEncode)
	if errDecode != nil {
		log.Fatalf("Error %v", errDecode)
	}

	rule := transformProcessRewards(ruleData)
	fmt.Println(rule)

	lib := ast.NewKnowledgeLibrary()
	rb := builder.NewRuleBuilder(lib)

	err := rb.BuildRuleFromResource("RedemptionRules", "0.0.1", pkg.NewBytesResource([]byte(rule)))
	if err != nil {
		return fmt.Errorf("Error building rule: %v", err)
	}

	kb, err := lib.NewKnowledgeBaseInstance("RedemptionRules", "0.0.1")
	if err != nil {
		return fmt.Errorf("Error getting knowledge base: %v", err)
	}

	eng := engine.NewGruleEngine()
	dctx := ast.NewDataContext()
	dctx.Add("Order", order)
	dctx.Add("Customer", customer)
	dctx.Add("Action", action)

	rewardProcessor := &RewardProcessor{}
	dctx.Add("RewardProcessor", rewardProcessor)

	err = eng.Execute(dctx, kb)
	if err != nil {
		return fmt.Errorf("Error executing rule: %v", err)
	}
	fmt.Println("Rule executed successfully.")
	return nil
}

var RuleWithMoreConditions = `
cnVsZSBSdWxlV2l0aE1vcmVDb25kaXRpb25zICJSdWxlV2l0aE1vcmVDb25kaXRpb25zIiB7CiAgICB3aGVuCiAgICAgICAgKE9yZGVyLlRvdGFsID49IDEwMCkgPT0gdHJ1ZQogICAgdGhlbgogICAgICAgIHByb2Nlc3NSZXdhcmRzKE9yZGVyLCAicmVkZWVtUG9pbnRzIiwgeyBjb252ZXJzaW9uUmF0ZTogMTAsIGN1cnJlbmN5OiAiVVNEIiB9KTsKICAgICAgICAgICAgcHJvY2Vzc1Jld2FyZHMoT3JkZXIsICJyZWRlZW1Qb2ludHMiLCB7IGJhc2VkUG9pbnQ6IDIsIGNvbnZlcnRlZERpc2NvdW50OiAxMCwgY3VycmVuY3k6ICJVU0QiIH0pOwogICAgICAgICAgICBwcm9jZXNzUmV3YXJkcyhPcmRlciwgInJlZGVlbVBvaW50cyIsIHsgY29udmVyc2lvblJhdGU6IDAuMDEsIHByb2R1Y3RJZDogIkEiLCBjdXJyZW5jeTogIlVTRCIgfSk7CiAgICAgICAgICAgIHByb2Nlc3NSZXdhcmRzKE9yZGVyLCAicmVkZWVtUG9pbnRzIiwgeyBiYXNlZFBvaW50OiAyLCBjb252ZXJ0ZWREaXNjb3VudDogMTAsIHByb2R1Y3RJZDogIkEiLCBjdXJyZW5jeTogIlVTRCIgfSk7CiAgICAgICAgcHJvY2Vzc1Jld2FyZHMoT3JkZXIsICJyZWRlZW1Wb3VjaGVyIiwgeyBjb2xsZWN0aW9uSWQ6IDB4QUFBLCBwZXJjZW50RGlzY291bnQ6IDAuMDUsIGN1cnJlbmN5OiAiVVNEIiB9KTsKICAgICAgICAgICAgcHJvY2Vzc1Jld2FyZHMoT3JkZXIsICJyZWRlZW1Wb3VjaGVyIiwgeyBjb2xsZWN0aW9uSWQ6IDB4QkJCLCBmaXhlZERpc2NvdW50OiAxMDAsIGN1cnJlbmN5OiAiVVNEIiB9KTsKICAgICAgICAgICAgcHJvY2Vzc1Jld2FyZHMoT3JkZXIsICJyZWRlZW1Wb3VjaGVyIiwgeyBjb2xsZWN0aW9uSWQ6IDB4Q0NDLCBwZXJjZW50RGlzY291bnQ6IDAuMDUsIHByb2R1Y3RJZDogIkEiLCBjdXJyZW5jeTogIlVTRCIgfSk7CiAgICAgICAgICAgIHByb2Nlc3NSZXdhcmRzKE9yZGVyLCAicmVkZWVtVm91Y2hlciIsIHsgY29sbGVjdGlvbklkOiAweERERCwgIGZpeGVkRGlzY291bnQ6IDEwMCwgcHJvZHVjdElkOiAiQSIsIGN1cnJlbmN5OiAiVVNEIiB9KQogICAgICAgIFJldHJhY3QoIlJ1bGVXaXRoTW9yZUNvbmRpdGlvbnMiKTsKfQo=
`

func main() {
	order := &Order{
		Total:          150,
		Amount:         6,
		PlaceOrderDate: 1722655565,
		Tier:           "Tier1",
		Channels:       []Channel{Offline},
		Source:         "London1",
		Currency:       "USD",
		CLV:            2500,
		Products: []*Product{
			&Product{
				SKU:      "SKU1",
				Category: "Category1",
				Price:    10,
				Quantity: 5,
				Currency: "USD",
			},
			&Product{
				SKU:      "SKU2",
				Category: "Category2",
				Price:    100,
				Quantity: 1,
				Currency: "USD",
			},
		},
	}

	customer := &Customer{Tier: "Tier1"}
	action := &Action{Event: "ABC123"}

	err := executeRule(order, customer, action, RuleWithMoreConditions)
	if err != nil {
		fmt.Println(err)
	}

	fmt.Println("Reward Results:")
	for _, result := range rewardResults {
		fmt.Printf("%v\n", result)
	}
}
