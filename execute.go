package main

import (
	"encoding/base64"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/hyperjumptech/grule-rule-engine/ast"
	"github.com/hyperjumptech/grule-rule-engine/builder"
	"github.com/hyperjumptech/grule-rule-engine/engine"
	"github.com/hyperjumptech/grule-rule-engine/pkg"
)

type Item struct {
	Total      int
	Amount     int
	PlaceOrder [2]time.Time

	SKU       string
	Category  string
	Attribute map[string]string

	Tier         string
	RegisterDate string
	CLV          int

	Channels []string
	StoreID  string

	EventID      string
	ReferralCode string
	GameID       string
	MissionID    string

	Result    string
	MintPoint int
	Voucher   bool

	Currency string
	DebugLog string
}

func ruleEngineDecode(encodedRuleText string) (string, error) {
	encodedRuleText = strings.TrimSpace(encodedRuleText)

	if len(encodedRuleText)%4 != 0 {
		encodedRuleText += strings.Repeat("=", 4-len(encodedRuleText)%4)
	}

	decodedBytes, err := base64.StdEncoding.DecodeString(encodedRuleText)
	if err != nil {
		return "", err
	}

	decodedString := string(decodedBytes)
	// Loại bỏ dấu ngoặc kép quanh tên rule, ví dụ: rule "Cart" -> rule Cart
	decodedString = strings.Replace(decodedString, `rule "`, `rule `, 1)
	decodedString = strings.Replace(decodedString, `" {`, ` {`, 1) // Loại bỏ dấu " trước dấu {

	return decodedString, nil
}

func applyRules(item *Item, encodedRuleValue string, ruleName string, version string) error {
	// Decode the Base64 encoded rule
	ruleString, err := ruleEngineDecode(encodedRuleValue)
	if err != nil {
		return fmt.Errorf("Error decoding rule: %v", err)
	}

	// Process the decoded rule string
	updatedRuleString := updateRuleString(ruleString)

	dataContext := ast.NewDataContext()
	err = dataContext.Add("Item", item)
	if err != nil {
		return err
	}

	fmt.Printf("================01: %+v\n", item)
	fmt.Printf("Debug Item: Amount=%d, Currency=%s\n", item.Amount, item.Currency)

	kb := ast.NewKnowledgeLibrary()
	ruleBuilder := builder.NewRuleBuilder(kb)

	resource := pkg.NewBytesResource([]byte(updatedRuleString))
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

func updateRuleString(ruleString string) string {
	objectsToReplace := []string{"Cart", "Product", "Customer", "Source", "Action"}

	for _, obj := range objectsToReplace {
		ruleString = strings.ReplaceAll(ruleString, obj+".", "Item.")
	}

	return ruleString
}

func main() {
	item := &Item{
		Total:  10000000,
		Amount: 9000000,
		PlaceOrder: [2]time.Time{
			time.Date(2024, time.January, 1, 0, 0, 0, 0, time.UTC),
			time.Date(2024, time.December, 31, 0, 0, 0, 0, time.UTC),
		},
		SKU:      "SKU1",
		Category: "Iphone",
		Tier:     "Tier 1",
		Channels: []string{"Online", "Offline"},
		Currency: "USD",
		DebugLog: "",
	}

	// Base64 encoded rule string
	encodedRuleValue := `cnVsZSBjYXJ0IHsKICAgIHdoZW4KICAgICAgQ2FydC5Ub3RhbCA+PSA1MDAgJiYgQ2FydC5DdXJyZW5jeSA9PSAiVVNEIgogICAgdGhlbgogICAgICBDYXJ0LlJlc3VsdCA9ICJDb25kaXRpb24gbWV0IjsKICAgICAgQ2FydC5NaW50UG9pbnQgPSBDYXJ0LlRvdGFsIC8gMTAwMDsKICAgICAgQ2FydC5Wb3VjaGVyID0gdHJ1ZTsKICAgICAgUmV0cmFjdCgiY2FydCIpOwp9`

	// Apply rules
	err := applyRules(item, encodedRuleValue, "CartAmount", "0.1.0")
	if err != nil {
		log.Fatalf("Error applying rules: %v", err)
	}

	// Print the result after rule execution
	fmt.Printf("Item after rule execution: %+v\n", item)
}
