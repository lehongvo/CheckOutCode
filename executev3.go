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
	SKU      string
	Category string
	Price    float64
	Quantity int
	Currency string
}

// Voucher struct to hold information for vouchers
type Voucher struct {
	CollectionId        string
	PercentDiscount     float64
	FixedAmountDiscount float64
	DiscountAmount      float64
}

// RedempPoint struct representing redemption points
type RedempPoint struct {
	BasedPoint        float64
	ConvertedDiscount float64
	PointToConvert    float64
	ConversionRate    float64
}

// Item struct representing a product in the cart
type Item struct {
	Total          float64
	Amount         float64
	PlaceOrderDate int64
	Tier           Tier
	Channels       []Channel
	Source         string
	Currency       string
	CLV            float64
	Products       []*Product
	RedempVouchers []*Voucher
	RedempPoints   []*RedempPoint // Declare RedempPoints as a slice of pointers
	Result         string
}

// RuleHelper structure with a method to add multiple vouchers
type RuleHelper struct{}

// AddVoucher adds vouchers to the item's RedempVouchers
func (r *RuleHelper) AddVoucher(item *Item, vouchers ...*Voucher) {
	item.RedempVouchers = append(item.RedempVouchers, vouchers...)
}

// Contains checks if the category contains a substring
func (r *RuleHelper) Contains(category, substring string) bool {
	return strings.Contains(category, substring)
}

func applyRules(item *Item, product *Product, ruleName string, version string) error {
	// Simplified rule string for testing
	ruleString := `
rule Rule2SKU1 "Rule 3 - Product SKU1" {
    when
        (Item.Total >= 100 &&
            Item.CLV > 2000 &&
            Item.Channels[0] == 1 &&
            Item.Source == "London1" &&
            Item.Currency == "USD" &&
            Helper.Contains(Item.Products[0].Category, "Iphone") &&
            Product.SKU == "SKU1") == true
    then
        Item.RedempPoints[0].ConversionRate = 1;
        Item.RedempPoints[0].PointToConvert = Item.RedempPoints[0].ConversionRate;

        Item.RedempVouchers[0].CollectionId = "0xCCC";
        Item.RedempVouchers[0].PercentDiscount = 0.05;
        Item.RedempVouchers[0].DiscountAmount = Product.Price * Product.Quantity * Item.RedempVouchers[0].PercentDiscount;

        Retract("Rule2SKU1");
}
`
	dataContext := ast.NewDataContext()
	err := dataContext.Add("Item", item)
	if err != nil {
		return err
	}

	err = dataContext.Add("Product", product)
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

// printItemDetails prints the details of the entire item, including products and vouchers
func printItemDetails(item *Item) {
	fmt.Printf("Item details:\n")
	fmt.Printf("Total: %.2f\n", item.Total)
	fmt.Printf("Amount: %.2f\n", item.Amount)
	fmt.Printf("PlaceOrderDate: %d\n", item.PlaceOrderDate)
	fmt.Printf("Tier: %s\n", item.Tier)
	fmt.Printf("Channels: %v\n", item.Channels)
	fmt.Printf("Source: %s\n", item.Source)
	fmt.Printf("Currency: %s\n", item.Currency)
	fmt.Printf("CLV: %.2f\n", item.CLV)
	fmt.Printf("Result: %s\n", item.Result)

	// Print each product in detail
	fmt.Printf("\nProducts:\n")
	for _, product := range item.Products {
		fmt.Printf("- SKU: %s, Category: %s, Price: %.2f, Quantity: %d, Currency: %s\n",
			product.SKU, product.Category, product.Price, product.Quantity, product.Currency)
	}

	// Print each point in detail
	fmt.Printf("\nRedempPoints:\n")
	for i, point := range item.RedempPoints {
		fmt.Printf("- Point %d: BasedPoint=%.2f, ConvertedDiscount=%.2f, PointToConvert=%.2f, ConversionRate=%.2f\n",
			i+1, point.BasedPoint, point.ConvertedDiscount, point.PointToConvert, point.ConversionRate)
	}

	// Print each voucher in detail
	fmt.Printf("\nVouchers:\n")
	for i, voucher := range item.RedempVouchers {
		fmt.Printf("- Voucher %d: CollectionId=%s, PercentDiscount=%.2f, FixedAmountDiscount=%.2f, DiscountAmount=%.2f\n",
			i+1, voucher.CollectionId, voucher.PercentDiscount, voucher.FixedAmountDiscount, voucher.DiscountAmount)
	}
}

func main() {
	item := &Item{
		Total:          150,
		Amount:         6,
		PlaceOrderDate: 1724235564,
		Tier:           Tier1,
		Channels:       []Channel{Offline}, // Enum value for Offline
		Source:         "London1",
		Currency:       "USD",
		CLV:            2500,
		RedempPoints: []*RedempPoint{ // Initialize RedempPoints as a slice of pointers
			&RedempPoint{},
		},
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
			&Product{
				SKU:      "SKU2",
				Category: "Macbook",
				Price:    100,
				Quantity: 1,
				Currency: "USD",
			},
		},
		RedempVouchers: []*Voucher{
			&Voucher{},
			&Voucher{},
		},
	}

	// Loop through each product and apply the rule
	for _, product := range item.Products {
		err := applyRules(item, product, "Rule2SKU1", "0.1.0")
		if err != nil {
			log.Fatalf("Error applying rules: %v", err)
		}
	}

	// Print the entire item details after applying the rules
	printItemDetails(item)
}
