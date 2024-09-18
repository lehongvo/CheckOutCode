package main

import (
	"fmt"
	"log"

	"github.com/hyperjumptech/grule-rule-engine/ast"
	"github.com/hyperjumptech/grule-rule-engine/builder"
	"github.com/hyperjumptech/grule-rule-engine/engine"
	"github.com/hyperjumptech/grule-rule-engine/pkg"
)

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
	PlaceOrderDate string
	RedempVouchers []*Voucher
	RedempPoints   []*RedempPoint
}

// Helper struct with necessary helper methods for rule processing
type Helper struct{}

// ProcessPointRewards function to simulate rewards processing
func (h *Helper) ProcessPointRewards(item *Item, rewardType string, index int, reward map[string]interface{}) {
	if rewardType == "redeemPoints" {
		if convRate, ok := reward["conversionRate"]; ok {
			item.RedempPoints[index].ConversionRate = convRate.(float64)
			item.RedempPoints[index].PointToConvert = item.RedempPoints[index].ConversionRate
		}
		if basedPoint, ok := reward["basedPoint"]; ok {
			item.RedempPoints[index].BasedPoint = basedPoint.(float64)
			if convertedDiscount, ok := reward["convertedDiscount"]; ok {
				item.RedempPoints[index].ConvertedDiscount = convertedDiscount.(float64)
			}
		}
	} else if rewardType == "redeemVouchers" {
		if percentDiscount, ok := reward["percentDiscount"]; ok {
			item.RedempVouchers[index].PercentDiscount = percentDiscount.(float64)
			item.RedempVouchers[index].DiscountAmount = item.Total * (percentDiscount.(float64) / 100)
		}
		if fixedDiscount, ok := reward["fixedAmountDiscount"]; ok {
			item.RedempVouchers[index].FixedAmountDiscount = fixedDiscount.(float64)
			item.RedempVouchers[index].DiscountAmount = fixedDiscount.(float64)
		}
	}
}

// applyRules function to build and execute the rule engine
func applyRules(item *Item, ruleName string, version string) error {
	// Rule string that defines the logic in Grule
	ruleString := `
rule RuleWithMoreConditions "RuleWithMoreConditions" {
    when
        (Item.Total >= 100 &&
        Item.Amount >= 2 &&
        Item.PlaceOrderDate >= "2023-01-01" && Item.PlaceOrderDate <= "2023-12-31") == true
    then
        Helper.ProcessPointRewards(Item, "redeemPoints", 0, { "conversionRate": 10 });
        Helper.ProcessPointRewards(Item, "redeemPoints", 1, { "basedPoint": 2, "convertedDiscount": 10 });
        Helper.ProcessPointRewards(Item, "redeemPoints", 2, { "conversionRate": 0.01, "productId": "A" });
        Helper.ProcessPointRewards(Item, "redeemPoints", 3, { "basedPoint": 2, "convertedDiscount": 10, "productId": "A" });
        Helper.ProcessPointRewards(Item, "redeemVouchers", 0, { "collectionId": "0xAAA", "percentDiscount": 5 });
        Helper.ProcessPointRewards(Item, "redeemVouchers", 1, { "collectionId": "0xBBB", "fixedAmountDiscount": 100 });
        Helper.ProcessPointRewards(Item, "redeemVouchers", 2, { "collectionId": "0xCCC", "percentDiscount": 5, "productId": "A" });
        Helper.ProcessPointRewards(Item, "redeemVouchers", 3, { "collectionId": "0xDDD", "fixedAmountDiscount": 100, "productId": "A" });
        Retract("RuleWithMoreConditions");
}
`

	// Initialize data context and add the item
	dataContext := ast.NewDataContext()
	err := dataContext.Add("Item", item)
	if err != nil {
		return err
	}

	// Add helper function
	helper := &Helper{}
	err = dataContext.Add("Helper", helper)
	if err != nil {
		return err
	}

	// Build the rule engine
	kb := ast.NewKnowledgeLibrary()
	ruleBuilder := builder.NewRuleBuilder(kb)
	resource := pkg.NewBytesResource([]byte(ruleString))
	err = ruleBuilder.BuildRuleFromResource(ruleName, version, resource)
	if err != nil {
		return fmt.Errorf("failed to build rule '%s': %v", ruleName, err)
	}

	// Create knowledge base instance
	knowledgeBase, err := kb.NewKnowledgeBaseInstance(ruleName, version)
	if err != nil {
		return fmt.Errorf("failed to create knowledge base for rule '%s': %v", ruleName, err)
	}

	// Create and execute the engine
	eng := engine.NewGruleEngine()
	eng.MaxCycle = 1000
	err = eng.Execute(dataContext, knowledgeBase)
	if err != nil {
		return fmt.Errorf("failed to execute rule engine for rule '%s': %v", ruleName, err)
	}

	return nil
}

func main() {
	// Initialize the item and products
	item := &Item{
		Total:          150,
		Amount:         6,
		PlaceOrderDate: "2023-06-15",
		RedempPoints: []*RedempPoint{
			{}, {}, {}, {}, // Initialize 4 reward points
		},
		RedempVouchers: []*Voucher{
			{}, {}, {}, {}, // Initialize 4 vouchers
		},
	}

	// Apply the rule
	err := applyRules(item, "RuleWithMoreConditions", "0.1.0")
	if err != nil {
		log.Fatalf("Error applying rules: %v", err)
	}

	// Output the results after the rule has been applied
	fmt.Println("Redemption Points:")
	for i, rp := range item.RedempPoints {
		fmt.Printf("Point %d: ConversionRate=%.2f, BasedPoint=%.2f, ConvertedDiscount=%.2f, PointToConvert=%.2f\n",
			i+1, rp.ConversionRate, rp.BasedPoint, rp.ConvertedDiscount, rp.PointToConvert)
	}

	fmt.Println("Vouchers:")
	for i, v := range item.RedempVouchers {
		fmt.Printf("Voucher %d: CollectionId=%s, PercentDiscount=%.2f, FixedAmountDiscount=%.2f, DiscountAmount=%.2f\n",
			i+1, v.CollectionId, v.PercentDiscount, v.FixedAmountDiscount, v.DiscountAmount)
	}
}
