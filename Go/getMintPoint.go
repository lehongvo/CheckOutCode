package main

import (
	"encoding/base64"
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
	MintPoint int
	Voucher   []string

	Currency string
	DebugLog string
}

// Tạo RuleHelper với hàm AddVoucher
type RuleHelper struct{}

func (r *RuleHelper) AddVoucher(item *Item, voucher string) {
	item.Voucher = append(item.Voucher, voucher)
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

func helperTransformRule(ruleString string) string {
	lines := strings.Split(ruleString, "\n")
	var outputLines []string

	for _, line := range lines {
		if strings.Contains(line, "Item.MintPoint") {
			continue
		}
		if strings.Contains(line, "Item.Voucher") {
			startIdx := strings.Index(line, `{"collection_id":"`)
			endIdx := strings.Index(line[startIdx:], `","`) + startIdx
			if startIdx != -1 && endIdx != -1 {
				collectionID := line[startIdx+18 : endIdx]
				line = fmt.Sprintf("      Helper.AddVoucher(Item, \"%s\");", collectionID)
			}
		}
		outputLines = append(outputLines, line)
	}

	// Ghép lại các dòng thành một chuỗi mới
	return strings.Join(outputLines, "\n")
}

func applyRules(item *Item, encodedRuleValue string, ruleName string, version string) error {
	ruleString, err := ruleEngineDecode(encodedRuleValue)
	if err != nil {
		return fmt.Errorf("Error decoding rule: %v", err)
	}

	updatedRuleStringWithVoucherData := updateRuleString(ruleString)

	updatedRuleString := helperTransformRule(updatedRuleStringWithVoucherData)

	fmt.Printf("123%s\n", updatedRuleString)

	dataContext := ast.NewDataContext()
	err = dataContext.Add("Item", item)
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
		Total:          10000000,
		Amount:         9000000,
		PlaceOrderDate: 1724235564,
		SKU:            "SKU1",
		Category:       "Iphone",
		Tier:           Tier1,
		Channels:       []Channel{Online, Offline},
		Currency:       "USD",
		DebugLog:       "",
	}

	encodedRuleValue := `cnVsZSAiZGFzZHNhZCIgewogICAgd2hlbgogICAgICAxID09IDEKICAgIHRoZW4KICAgICAgQ2FydC5SZXN1bHQgPSAiQ29uZGl0aW9uIG1ldCI7CiAgICAgIENhcnQuTWludFBvaW50ID0gW3sicG9pbnRfY2FydF90b3RhbCI6eyJjdXJyZW5jeV9pZCI6MCwicG9pbnRfYW1vdW50IjoiIiwidmFsdWUiOiIiLCJhbW91bnRfdmFsdWUiOiIifSwicG9pbnRfcHJvZHVjdF9yZXdhcmQiOnsiY3VycmVuY3lfaWQiOjAsInByb2R1Y3RfbmFtZSI6IiIsInBvaW50X2Ftb3VudCI6IiIsInZhbHVlIjoiIiwiYW1vdW50X3ZhbHVlIjoiIn19XTsKICAgICAgQ2FydC5Wb3VjaGVyID0gW3siY29sbGVjdGlvbl9pZCI6IjNiOTY5MzE2LTVkZjMtNDIwZS1iNzhlLTk5OTJiMTkwMDZmOCIsInBvaW50X2NhcnRfdG90YWwiOnsiY3VycmVuY3lfaWQiOiJVU0QiLCJ2YWx1ZSI6IiIsImRpc2NvdW50X3JhdGUiOiIxIn0sInBvaW50X3Byb2R1Y3RfcmV3YXJkIjp7ImN1cnJlbmN5X2lkIjoiVVNEIiwicHJvZHVjdF9uYW1lIjp7ImlkIjoxLCJ2YWx1ZSI6Ik1vdXNlIExvZ2l0ZWNoIiwibGFiZWwiOiJNb3VzZSBMb2dpdGVjaCJ9LCJkaXNjb3VudF9yYXRlIjoiMSIsInZhbHVlIjoiIn19XTsKICAgICAgUmV0cmFjdCgiZGFzZHNhZCIpOwp9`

	err := applyRules(item, encodedRuleValue, "CartAmount", "0.1.0")
	if err != nil {
		log.Fatalf("Error applying rules: %v", err)
	}

	fmt.Printf("Item after rule execution: %+v\n", item)
}
