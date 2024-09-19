package main

import (
	"fmt"

	"github.com/hyperjumptech/grule-rule-engine/ast"
	"github.com/hyperjumptech/grule-rule-engine/builder"
	"github.com/hyperjumptech/grule-rule-engine/engine"
	"github.com/hyperjumptech/grule-rule-engine/pkg"
)

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
	Total          float64
	Amount         int
	PlaceOrderDate int64
	Tier           string
	Channels       []Channel
	Source         string
	Currency       string
	CLV            float64
	Products       []*Product
}

// Hàm kiểm tra SKU
func (o *Order) CheckSkuContains(skus []string) bool {
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
func (o *Order) CheckCategoryContains(categories []string) bool {
	for _, category := range categories {
		for _, product := range o.Products {
			if product.Category == category {
				return true
			}
		}
	}
	return false
}

// Hàm xử lý phần thưởng
func processRewards(order *Order, rewardType string, conversionRate float64, currency string, basedPoint int, convertedDiscount int, productId string) {
	fmt.Printf("Processing %s: conversionRate=%f, currency=%s, basedPoint=%d, convertedDiscount=%d, productId=%s\n", rewardType, conversionRate, currency, basedPoint, convertedDiscount, productId)
}

// Hàm thực thi rule
func executeRule(order *Order, customer *Customer, action *Action, skus []string, categories []string, rule string) error {
	// Tạo knowledge base và builder
	lib := ast.NewKnowledgeLibrary()
	rb := builder.NewRuleBuilder(lib)

	// Xây dựng rule từ resource
	err := rb.BuildRuleFromResource("RedemptionRules", "0.0.1", pkg.NewBytesResource([]byte(rule)))
	if err != nil {
		return fmt.Errorf("Error building rule: %v", err)
	}

	kb, err := lib.NewKnowledgeBaseInstance("RedemptionRules", "0.0.1")
	if err != nil {
		return fmt.Errorf("Error getting knowledge base: %v", err)
	}

	// Tạo engine và DataContext
	eng := engine.NewGruleEngine()
	dctx := ast.NewDataContext()
	dctx.Add("Order", order)
	dctx.Add("Customer", customer)
	dctx.Add("Action", action)
	dctx.Add("Skus", skus)
	dctx.Add("Categories", categories)
	dctx.Add("processRewards", processRewards)

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
        Order.Total >= 100 &&
        Order.Amount >= 2 &&
        Order.PlaceOrderDate >= 1726655565 && Order.PlaceOrderDate <= 1726755565 &&
        Order.CheckSkuContains(Skus) == true &&  // Thay thế danh sách SKU bằng biến Skus
        Order.CheckCategoryContains(Categories) == true &&  // Thay thế danh sách Category bằng biến Categories
        Customer.Tier == "Tier1" &&
        Action.Event == "ABC123"
    then
        processRewards(Order, "redeemPoints", 10.0, "USD", 0, 0, "");
        processRewards(Order, "redeemPoints", 0.0, "USD", 2, 10, "");
        processRewards(Order, "redeemPoints", 0.01, "USD", 0, 0, "A");
        processRewards(Order, "redeemPoints", 0.0, "USD", 2, 10, "A");
        processRewards(Order, "redeemVoucher", 0.0, "USD", 0, 0, "");
        processRewards(Order, "redeemVoucher", 0.0, "USD", 0, 100, "");
        processRewards(Order, "redeemVoucher", 0.0, "USD", 0, 0, "A");
        processRewards(Order, "redeemVoucher", 0.0, "USD", 0, 100, "A");
        Retract("RuleWithMoreConditions");
}
`

type Customer struct {
	Tier string
}

type Action struct {
	Event string
}

func printOrderDetails(order *Order) {
	fmt.Println("===============")
	fmt.Println("Order Details:")
	fmt.Printf("Total: %.2f\n", order.Total)
	fmt.Printf("Amount: %d\n", order.Amount)
	fmt.Printf("Place Order Date: %d\n", order.PlaceOrderDate)
	fmt.Printf("Tier: %s\n", order.Tier)
	fmt.Printf("Channels: %v\n", order.Channels)
	fmt.Printf("Source: %s\n", order.Source)
	fmt.Printf("Currency: %s\n", order.Currency)
	fmt.Printf("CLV: %.2f\n", order.CLV)
	fmt.Println("Products:")
	for i, product := range order.Products {
		fmt.Println("===============")
		fmt.Printf("  Product %d:\n", i+1)
		fmt.Printf("    SKU: %s\n", product.SKU)
		fmt.Printf("    Category: %s\n", product.Category)
		fmt.Printf("    Price: %.2f\n", product.Price)
		fmt.Printf("    Quantity: %d\n", product.Quantity)
		fmt.Printf("    Currency: %s\n", product.Currency)
		fmt.Println("===============")
	}

}

func main() {
	// Tạo dữ liệu mẫu
	order := &Order{
		Total:          150,
		Amount:         6,
		PlaceOrderDate: 1724235564,
		Tier:           "Tier1",
		Channels:       []Channel{Offline},
		Source:         "London1",
		Currency:       "USD",
		CLV:            2500,
		Products: []*Product{
			&Product{
				SKU:      "SKU1",
				Category: "Iphone",
				Price:    10,
				Quantity: 5,
				Currency: "USD",
			},
			&Product{
				SKU:      "SKU2",
				Category: "Macbook",
				Price:    100,
				Quantity: 1,
				Currency: "USD",
			},
		},
	}

	customer := &Customer{Tier: "Tier1"}
	action := &Action{Event: "ABC123"}

	// Tạo danh sách SKU và Category
	skus := []string{"SKU1", "SKU2"}
	categories := []string{"Category1", "Category2"}

	// Thực thi rule
	err := executeRule(order, customer, action, skus, categories, RuleWithMoreConditions)
	if err != nil {
		fmt.Println(err)
	}
	printOrderDetails(order)
}
