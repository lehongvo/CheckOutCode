package main

import (
	"encoding/base64"
	"fmt"
	"log"
	"strings"
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

type Item struct {
	Total          float64
	Amount         float64
	PlaceOrderDate int

	SKU       string
	Category  string
	Attribute map[string]string

	Tier         Tier
	RegisterDate string
	CLV          int

	Channels []Channel
	StoreID  string

	EventID      string
	ReferralCode string
	GameID       string
	MissionID    string

	Result    string
	MintPoint float64
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
	decodedString = strings.Replace(decodedString, `rule "`, `rule `, 1)
	decodedString = strings.Replace(decodedString, `" {`, ` {`, 1)

	return decodedString, nil
}

func applyRules(item *Item, encodedRuleValue string, ruleName string, version string) error {
	ruleString, err := ruleEngineDecode(encodedRuleValue)
	fmt.Println(ruleString)
	if err != nil {
		return fmt.Errorf("Error decoding rule: %v", err)
	}

	// updatedRuleString := updateRuleString(ruleString)
	// fmt.Println(ruleString)

	// dataContext := ast.NewDataContext()
	// err = dataContext.Add("Item", item)
	// if err != nil {
	// 	return err
	// }

	// kb := ast.NewKnowledgeLibrary()
	// ruleBuilder := builder.NewRuleBuilder(kb)

	// resource := pkg.NewBytesResource([]byte(updatedRuleString))
	// err = ruleBuilder.BuildRuleFromResource(ruleName, version, resource)
	// if err != nil {
	// 	return fmt.Errorf("failed to build rule '%s': %v", ruleName, err)
	// }

	// knowledgeBase, err := kb.NewKnowledgeBaseInstance(ruleName, version)
	// if err != nil {
	// 	return fmt.Errorf("failed to create knowledge base for rule '%s': %v", ruleName, err)
	// }

	// eng := engine.NewGruleEngine()
	// eng.MaxCycle = 1000

	// err = eng.Execute(dataContext, knowledgeBase)
	// if err != nil {
	// 	return fmt.Errorf("failed to execute rule engine for rule '%s': %v", ruleName, err)
	// }

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
		Total:          825,
		Amount:         9000000,
		PlaceOrderDate: 1724235564,
		SKU:            "SKU1",
		Category:       "Iphone",
		Tier:           Tier1,
		Channels:       []Channel{Online, Offline},
		Currency:       "USD",
		DebugLog:       "",
	}

	encodedRuleValue := `cnVsZSAiUmV3YXJkIFBvaW50IDIiIHsKICAgICAgd2hlbgogICAgICAgIENhcnQuVG90YWwgPj0gMjAwICYmIENhcnQuQ3VycmVuY3kgPT0gIlVTRCIKICAgICAgdGhlbgogICAgICAgIENhcnQuUmVzdWx0ID0gIkNvbmRpdGlvbiBtZXQiOwogICAgICAgIENhcnQuTWludFBvaW50ID0gQ2FydC5Ub3RhbCAvIDAuMDE7CiAgICAgICAgQ2FydC5Wb3VjaGVyID0gZmFsc2U7CiAgICAgICAgUmV0cmFjdCgiUmV3YXJkIFBvaW50IDIiKTsKICB9`

	err := applyRules(item, encodedRuleValue, "CartAmount", "0.1.0")
	if err != nil {
		log.Fatalf("Error applying rules: %v", err)
	}

	fmt.Printf("Item after rule execution: %+v\n", item)
}
