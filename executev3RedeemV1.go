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

// Cập nhật hàm ProcessRewards để xử lý logic hiển thị
func (rp *RewardProcessor) ProcessRewards(order *Order, rewardType string, collectionId string, conversionRate float64, currency string, productId string, basedPoint float64, convertedDiscount float64, fixedPoint float64, basedAmount float64) {
	result := map[string]interface{}{
		"rewardType": rewardType,
	}

	// Chỉ thêm collectionId nếu có giá trị
	if collectionId != "" {
		result["collectionId"] = collectionId
	}

	// Nếu fixedPoint > 0 thì không thêm currency, ngược lại thêm currency
	if fixedPoint == 0 && currency != "" {
		result["currency"] = currency
	}

	// Xử lý các giá trị khác nhau dựa trên loại rewardType
	if rewardType == "earningPoints" {
		if conversionRate != 0 {
			result["conversionRate"] = conversionRate
		}
		// Thêm productId nếu khác "none"
		if productId != "none" {
			result["productId"] = productId
		}
		if basedPoint != 0 {
			result["basedPoint"] = basedPoint
		}

		if basedAmount != 0 {
			result["basedAmount"] = basedAmount
		}

		if convertedDiscount != 0 {
			result["convertedDiscount"] = convertedDiscount
		}
		// Chỉ thêm fixedPoint nếu nó có giá trị
		if fixedPoint != 0 {
			result["fixedPoint"] = fixedPoint
		}
	} else {
		if conversionRate != 0 {
			result["fixedDiscount"] = conversionRate
		}
		// Thêm productId nếu khác "none"
		if productId != "none" {
			result["productId"] = productId
		}
		if basedPoint != 0 {
			result["basedPoint"] = basedPoint
		}
		if convertedDiscount != 0 {
			result["percentDiscount"] = convertedDiscount
		}
		// Chỉ thêm fixedPoint nếu nó có giá trị
		if fixedPoint != 0 {
			result["fixedPoint"] = fixedPoint
		}
	}

	// Thêm kết quả vào danh sách rewardResults
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

func (o *Order) CheckChannelContains(channel string) bool {
	for _, ch := range o.Channels {
		if string(ch) == channel {
			return true
		}
	}
	return false
}

func (o *Order) CheckSourceContains(source string) bool {
	return o.Source == source
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

		// Sử dụng chuỗi trống nếu thiếu collectionId
		collectionId := paramMap["collectionId"]
		if collectionId == "" {
			collectionId = `""`
		}

		conversionRate := ensureFloat64(paramMap["conversionRate"])

		// Xử lý currency, mặc định là "USD"
		currency := paramMap["currency"]
		if currency == "" {
			currency = `"USD"`
		}

		productId := paramMap["productId"]
		if productId == "" {
			productId = `"none"`
		}

		basedPoint := ensureFloat64(paramMap["basedPoint"])
		convertedDiscount := ensureFloat64(paramMap["convertedDiscount"])
		fixedPoint := ensureFloat64(paramMap["fixedPoint"])
		basedAmount := ensureFloat64(paramMap["basedAmount"])

		var result string
		if rewardType == "redeemVoucher" || rewardType == "earningVouchers" {
			result = fmt.Sprintf(`RewardProcessor.ProcessRewards(Order, "%s", %s, %s, %s, %s, %s, %s, %s, %s);`,
				rewardType, collectionId, conversionRate, currency, productId, basedPoint, convertedDiscount, fixedPoint, basedAmount)
		} else {
			result = fmt.Sprintf(`RewardProcessor.ProcessRewards(Order, "%s", %s, %s, %s, %s, %s, %s, %s, %s);`,
				rewardType, collectionId, conversionRate, currency, productId, basedPoint, convertedDiscount, fixedPoint, basedAmount)
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
	fmt.Println(ruleData)

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
cnVsZSBSdWxlXzIxICJSdWxlXzIxIiB7CiAgICB3aGVuCiAgICAgICAgKE9yZGVyLlRvdGFsIDwgMjIyMiAmJgogICAgICAgICAgICBPcmRlci5BbW91bnQgPj0gMzMgJiYKICAgICAgICAgICAgT3JkZXIuQ2hlY2tDYXRlZ29yeUNvbnRhaW5zKCJNYWNib29rIikgJiYgT3JkZXIuQ2hlY2tDYXRlZ29yeUNvbnRhaW5zKCJMb2dpdGVjaCIpICYmIE9yZGVyLkNoZWNrQ2F0ZWdvcnlDb250YWlucygiSXBob25lIikpID09IHRydWUKICAgIHRoZW4KICAgICAgICBwcm9jZXNzUmV3YXJkcyhPcmRlciwgInJlZGVlbVBvaW50cyIsIHsgY29udmVyc2lvblJhdGU6IDIsIGN1cnJlbmN5OiAiMSIgfSk7CiAgICAgICAgICAgIHByb2Nlc3NSZXdhcmRzKE9yZGVyLCAicmVkZWVtUG9pbnRzIiwgeyBiYXNlZFBvaW50OiAzLCBjb252ZXJ0ZWREaXNjb3VudDogNCwgY3VycmVuY3k6ICIxIiB9KTsKICAgICAgICAgICAgcHJvY2Vzc1Jld2FyZHMoT3JkZXIsICJyZWRlZW1Qb2ludHMiLCB7IGNvbnZlcnNpb25SYXRlOiA1LCBwcm9kdWN0SWQ6ICIxIiwgY3VycmVuY3k6ICIxIiB9KTsKICAgICAgICAgICAgcHJvY2Vzc1Jld2FyZHMoT3JkZXIsICJyZWRlZW1Qb2ludHMiLCB7IGJhc2VkUG9pbnQ6IDYsIGNvbnZlcnRlZERpc2NvdW50OiA3LCBwcm9kdWN0SWQ6ICIyIiwgY3VycmVuY3k6ICIxIiB9KTsKICAgICAgICBwcm9jZXNzUmV3YXJkcyhPcmRlciwgInJlZGVlbVZvdWNoZXIiLCB7IGNvbGxlY3Rpb25JZDogIjEiLCBwZXJjZW50RGlzY291bnQ6IDAuMDgsIGN1cnJlbmN5OiAiMSIgfSk7CiAgICAgICAgICAgIHByb2Nlc3NSZXdhcmRzKE9yZGVyLCAicmVkZWVtVm91Y2hlciIsIHsgY29sbGVjdGlvbklkOiAiMjIyMjIiLCBmaXhlZERpc2NvdW50OiA5LCBwcm9kdWN0SWQ6ICIyIiwgY3VycmVuY3k6ICIxIiB9KTsKICAgICAgICBSZXRyYWN0KCJSdWxlXzIxIik7Cn0K
`

func main() {
	order := &Order{
		Total:          150,
		Amount:         40,
		PlaceOrderDate: 1722655565,
		Tier:           "Tier1",
		Channels:       []Channel{Offline},
		Source:         "London1",
		Currency:       "USD",
		CLV:            2500,
		Products: []*Product{
			&Product{
				SKU:      "SKU1",
				Category: "Macbook",
				Price:    10,
				Quantity: 5,
				Currency: "USD",
			},
			&Product{
				SKU:      "SKU2",
				Category: "Logitech",
				Price:    100,
				Quantity: 1,
				Currency: "USD",
			},
			&Product{
				SKU:      "SKU2",
				Category: "Iphone",
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
