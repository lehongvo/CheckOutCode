package main

import (
	"fmt"

	"github.com/hyperjumptech/grule-rule-engine/ast"
	"github.com/hyperjumptech/grule-rule-engine/builder"
	"github.com/hyperjumptech/grule-rule-engine/engine"
	"github.com/hyperjumptech/grule-rule-engine/pkg"
)

// Tạo slice toàn cục để lưu trữ kết quả processRewards
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

// RewardProcessor chứa hàm processRewards
type RewardProcessor struct{}

// Hàm xử lý phần thưởng và lưu vào biến toàn cục
func (rp *RewardProcessor) ProcessRewards(order *Order, rewardType string, conversionRate float64, currency string, productId string, basedPoint float64, convertedDiscount float64) {
	result := map[string]interface{}{
		"order":      order,
		"rewardType": rewardType,
		"currency":   currency,
	}

	// Chỉ thêm vào map nếu giá trị hợp lệ
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

	// Lưu kết quả
	rewardResults = append(rewardResults, result)
}

// Hàm kiểm tra SKU
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

// Hàm kiểm tra Category
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

// Hàm thực thi rule
func executeRule(order *Order, customer *Customer, action *Action, rule string) error {
	// Tạo knowledge base và builder
	lib := ast.NewKnowledgeLibrary()
	rb := builder.NewRuleBuilder(lib)

	// Xây dựng rule
	err := rb.BuildRuleFromResource("RedemptionRules", "0.0.1", pkg.NewBytesResource([]byte(rule)))
	if err != nil {
		return fmt.Errorf("Error building rule: %v", err)
	}

	kb, err := lib.NewKnowledgeBaseInstance("RedemptionRules", "0.0.1")
	if err != nil {
		return fmt.Errorf("Error getting knowledge base: %v", err)
	}

	// Chuẩn bị engine và dữ liệu
	eng := engine.NewGruleEngine()
	dctx := ast.NewDataContext()
	dctx.Add("Order", order)
	dctx.Add("Customer", customer)
	dctx.Add("Action", action)

	// Thêm rewardProcessor vào DataContext
	rewardProcessor := &RewardProcessor{}
	dctx.Add("RewardProcessor", rewardProcessor)

	// Thực thi rule
	err = eng.Execute(dctx, kb)
	if err != nil {
		return fmt.Errorf("Error executing rule: %v", err)
	}
	fmt.Println("Rule executed successfully.")
	return nil
}

// Định nghĩa rule
var RuleWithMoreConditions = `
rule RuleWithMoreConditions "RuleWithMoreConditions" {
    when
        (
		Order.Total >= 100.0 && 
		Order.Amount >= 2.0 &&
		Order.PlaceOrderDate >= 1721655565 && Order.PlaceOrderDate <= 1729655565 &&
		Customer.Tier == "Tier1" &&
		Action.Event == "ABC123" &&
		(Order.CheckSkuContains("SKU1") && Order.CheckSkuContains("SKU2")) && 
		(Order.CheckCategoryContains("Category1") && Order.CheckCategoryContains("Category2"))
	) == true
    then
        RewardProcessor.ProcessRewards(Order, "redeemPoints", 10.0, "USD", "", 0.0, 0.0);
        RewardProcessor.ProcessRewards(Order, "redeemPoints", 0.0, "USD", "", 2.0, 10.0);
        RewardProcessor.ProcessRewards(Order, "redeemPoints", 0.01, "USD", "A", 0.0, 0.0);
        RewardProcessor.ProcessRewards(Order, "redeemPoints", 0.0, "USD", "A", 2.0, 10.0);
        RewardProcessor.ProcessRewards(Order, "redeemVoucher", 0.0, "USD", "", 0.0, 0.05); 
        RewardProcessor.ProcessRewards(Order, "redeemVoucher", 100.0, "USD", "", 0.0, 0.0);
        RewardProcessor.ProcessRewards(Order, "redeemVoucher", 0.0, "USD", "A", 0.0, 0.05);
        RewardProcessor.ProcessRewards(Order, "redeemVoucher", 100.0, "USD", "A", 0.0, 0.0);
        Retract("RuleWithMoreConditions");
}
`

func main() {
	// Tạo dữ liệu mẫu
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

	// Thực thi rule
	err := executeRule(order, customer, action, RuleWithMoreConditions)
	if err != nil {
		fmt.Println(err)
	}

	// Hiển thị toàn bộ kết quả lưu trữ trong rewardResults
	fmt.Println("Reward Results:")
	for _, result := range rewardResults {
		fmt.Printf("%v\n", result)
	}
}
