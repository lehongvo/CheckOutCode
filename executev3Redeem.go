package main

import (
	"fmt"
	"log"
	"strings"

	"github.com/hyperjumptech/grule-rule-engine/ast"
	"github.com/hyperjumptech/grule-rule-engine/builder"
	"github.com/hyperjumptech/grule-rule-engine/engine"
	"github.com/hyperjumptech/grule-rule-engine/pkg"
)

// Enum for Channel
type Channel int

const (
	Online Channel = iota
	Offline
	Marketplace
	Partner
)

func (c Channel) String() string {
	return [...]string{"Online", "Offline", "Marketplace", "Partner"}[c]
}

// Enum for Tier
type Tier int

const (
	Tier1 Tier = iota
	Tier2
	Tier3
	Tier4
	Tier5
)

func (t Tier) String() string {
	return [...]string{"Tier1", "Tier2", "Tier3", "Tier4", "Tier5"}[t]
}

// Product struct to represent individual products
type Product struct {
	SKU         string
	Category    string
	ProductName string
	Price       float64
	Quantity    int
	Currency    string
}

// Voucher struct to hold information for vouchers
type Voucher struct {
	CollectionId  string
	DiscountType  string
	DiscountValue float64
	ProductId     string
	ProductName   string
}

// RedempPoint struct representing redemption points
type RedempPoint struct {
	BasedPoint        float64
	ConvertedDiscount float64
	PointToConvert    float64
	ConversionRate    float64
}

// Order struct representing a product in the cart
type Order struct {
	Total          float64
	Amount         float64
	PlaceOrderDate string
	Tier           Tier
	Channels       []Channel
	Source         string
	Currency       string
	CLV            float64
	Products       []*Product
	RedempVouchers []*Voucher
	RedempPoints   []*RedempPoint
	Result         string
}

// RuleHelper structure with a method to add multiple vouchers
type RuleHelper struct{}

// AddVoucher adds vouchers to the order's RedempVouchers
func (r *RuleHelper) AddVoucher(order *Order, vouchers ...*Voucher) {
	order.RedempVouchers = append(order.RedempVouchers, vouchers...)
}

// Contains checks if the product name contains a substring
func (r *RuleHelper) Contains(productName, substring string) bool {
	return strings.Contains(productName, substring)
}

func applyRules(order *Order, ruleName string, version string) error {
	ruleString := `
rule RuleWithMoreConditions_Iphone1 "RuleWithMoreConditions for Iphone1" {
    when
        (Order.Total >= 100 &&
        Order.Amount >= 2 &&
        Order.PlaceOrderDate >= "2023-01-01" &&
        Order.PlaceOrderDate <= "2023-12-31" &&
        Helper.Contains(Order.Products[0].ProductName, "Iphone1")) == true
    then
        // Cập nhật trực tiếp các thuộc tính của Order
        Order.RedempVouchers[0].CollectionId = "0xCCC";
        Order.RedempVouchers[0].DiscountType = "percent";
        Order.RedempVouchers[0].DiscountValue = 5.0;
        Order.RedempVouchers[0].ProductId = "A";
        Order.RedempVouchers[0].ProductName = "Iphone1";
        Retract("RuleWithMoreConditions_Iphone1");
}
`

	dataContext := ast.NewDataContext()
	err := dataContext.Add("Order", order)
	if err != nil {
		return err
	}

	ruleHelper := &RuleHelper{}
	err = dataContext.Add("Helper", ruleHelper)
	if err != nil {
		return err
	}

	kb := ast.NewKnowledgeLibrary()
	ruleBuilder := builder.NewRuleBuilder(kb)

	resource := pkg.NewBytesResource([]byte(ruleString))
	err = ruleBuilder.BuildRuleFromResource(ruleName, version, resource)
	if err != nil {
		return fmt.Errorf("failed to build rule '%s': %v", ruleName, err)
	}

	knowledgeBase, err := kb.NewKnowledgeBaseInstance(ruleName, version)
	if err != nil {
		return fmt.Errorf("failed to create knowledge base for rule '%s': %v", ruleName, err)
	}

	eng := engine.NewGruleEngine()
	eng.MaxCycle = 1000

	err = eng.Execute(dataContext, knowledgeBase)
	if err != nil {
		return fmt.Errorf("failed to execute rule engine for rule '%s': %v", ruleName, err)
	}

	return nil
}

func printOrderDetails(order *Order) {
	fmt.Printf("Order details:\n")
	fmt.Printf("Total: %.2f\n", order.Total)
	fmt.Printf("Amount: %.2f\n", order.Amount)
	fmt.Printf("PlaceOrderDate: %s\n", order.PlaceOrderDate)
	fmt.Printf("Tier: %s\n", order.Tier)
	fmt.Printf("Channels: %v\n", order.Channels)
	fmt.Printf("Source: %s\n", order.Source)
	fmt.Printf("Currency: %s\n", order.Currency)
	fmt.Printf("CLV: %.2f\n", order.CLV)
	fmt.Printf("Result: %s\n", order.Result)

	// Print each product in detail
	fmt.Printf("\nProducts:\n")
	for _, product := range order.Products {
		fmt.Printf("- SKU: %s, Category: %s, ProductName: %s, Price: %.2f, Quantity: %d, Currency: %s\n",
			product.SKU, product.Category, product.ProductName, product.Price, product.Quantity, product.Currency)
	}

	// Print each point in detail
	fmt.Printf("\nRedempPoints:\n")
	for i, point := range order.RedempPoints {
		fmt.Printf("- Point %d: BasedPoint=%.2f, ConvertedDiscount=%.2f, PointToConvert=%.2f, ConversionRate=%.2f\n",
			i+1, point.BasedPoint, point.ConvertedDiscount, point.PointToConvert, point.ConversionRate)
	}

	// Print each voucher in detail
	fmt.Printf("\nVouchers:\n")
	for i, voucher := range order.RedempVouchers {
		fmt.Printf("- Voucher %d: CollectionId=%s, DiscountType=%s, DiscountValue=%.2f, ProductName=%s\n",
			i+1, voucher.CollectionId, voucher.DiscountType, voucher.DiscountValue, voucher.ProductName)
	}
}

func main() {
	order := &Order{
		Total:          150,
		Amount:         6,
		PlaceOrderDate: "2023-06-15",
		Tier:           Tier1,
		Channels:       []Channel{Offline},
		Source:         "London1",
		Currency:       "USD",
		CLV:            2500,
		RedempPoints: []*RedempPoint{
			&RedempPoint{},
		},
		Products: []*Product{
			&Product{
				SKU:         "SKU1",
				Category:    "Iphone",
				ProductName: "Iphone1",
				Price:       10,
				Quantity:    5,
				Currency:    "USD",
			},
		},
		RedempVouchers: []*Voucher{
			&Voucher{},
		},
	}

	err := applyRules(order, "RuleWithMoreConditions", "0.1.0")
	if err != nil {
		log.Fatalf("Error applying rules: %v", err)
	}

	printOrderDetails(order)
}
