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

	fmt.Printf("Encoded rule text: %s\n", decodedString)

	return decodedString, nil
}

func helperTransformRule(ruleString string) string {
	// Thay đổi tên rule và giá trị của Item.Currency
	ruleString = strings.Replace(ruleString, "rule Get_point_and_voucher", "rule Reward_Point_and_Voucher", 1)
	ruleString = strings.Replace(ruleString, `Item.Currency == "undefined"`, `Item.Currency == "USD"`, 1)

	// Tìm dòng Item.Voucher và chuyển đổi thành Helper.AddVoucher
	lines := strings.Split(ruleString, "\n")
	for i, line := range lines {
		if strings.Contains(line, "Item.Voucher") {
			// Tìm giá trị trong dấu ngoặc vuông
			startIdx := strings.Index(line, `["`)
			endIdx := strings.Index(line, `"]`)
			if startIdx != -1 && endIdx != -1 {
				voucherValue := line[startIdx+2 : endIdx]
				// Thay thế dòng Item.Voucher bằng Helper.AddVoucher
				lines[i] = fmt.Sprintf(`        Helper.AddVoucher(Item, "%s");`, voucherValue)
			}
		}
	}

	// Thay đổi dòng Retract
	for i, line := range lines {
		if strings.Contains(line, `Retract("Get_point_and_voucher");`) {
			lines[i] = `        Retract("Reward_Point_and_Voucher");`
		}
	}

	// Ghép lại thành rule string mới
	return strings.Join(lines, "\n")
}

func applyRules(item *Item, encodedRuleValue string, ruleName string, version string) error {
	ruleString, err := ruleEngineDecode(encodedRuleValue)
	if err != nil {
		return fmt.Errorf("Error decoding rule: %v", err)
	}

	fmt.Printf("Rule string after update 01: %s\n", ruleString)

	updatedRuleStringWithVoucherData := updateRuleString(ruleString)

	updatedRuleString := helperTransformRule(updatedRuleStringWithVoucherData)

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
		Voucher:        []string{},
	}

	encodedRuleValue := `cnVsZSBOZXdfUG9pbnRfVm91Y2hlciB7CndoZW4KICAgIENhcnQuVG90YWwgPj0gMjAwICYmIENhcnQuQ3VycmVuY3kgPT0gIlVTRCIKdGhlbgogICAgQ2FydC5SZXN1bHQgPSAiQ29uZGl0aW9uIG1ldCI7CiAgICBDYXJ0Lk1pbnRQb2ludCA9IENhcnQuVG90YWwgLyAxMDA7CiAgICBDYXJ0LlZvdWNoZXIgPSBbImUzZTk0ODVlLTIwNTUtNDQzYS04ZDQ4LTFjNmQ1ZWM3ZjE4OSJdOwogICAgUmV0cmFjdCgiTmV3Xy1fUG9pbnRfJl9Wb3VjaGVyIik7Cn0=`

	err := applyRules(item, encodedRuleValue, "CartAmount", "0.1.0")
	if err != nil {
		log.Fatalf("Error applying rules: %v", err)
	}

	fmt.Printf("Item after rule execution: %+v\n", item)
}
