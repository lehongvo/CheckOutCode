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
	MintPoint int
	Voucher   []string

	Currency  string
	DebugLog  string
	IsProduct bool
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
		trimmedLine := strings.TrimSpace(line)

		if strings.Contains(trimmedLine, "Item.Voucher = []") {
			continue
		}

		if strings.Contains(trimmedLine, "Item.Voucher") {
			startIdx := strings.Index(trimmedLine, "[\"")
			endIdx := strings.LastIndex(trimmedLine, "\"]")
			if startIdx != -1 && endIdx != -1 && endIdx > startIdx {
				voucherValue := trimmedLine[startIdx+2 : endIdx]
				line = fmt.Sprintf("      Helper.AddVoucher(Item, \"%s\");", voucherValue)
			} else {
				continue
			}
		}

		outputLines = append(outputLines, line)
	}

	return strings.Join(outputLines, "\n")
}

func applyRules(item *Item, encodedRuleValue string, ruleName string, version string) error {
	ruleString, err := ruleEngineDecode(encodedRuleValue)

	fmt.Printf("123%s\n", ruleString)

	// if err != nil {
	// 	return fmt.Errorf("Error decoding rule: %v", err)
	// }

	// updatedRuleStringWithVoucherData := updateRuleString(ruleString)

	// fmt.Printf("123%s\n", updatedRuleStringWithVoucherData)

	// updatedRuleString := helperTransformRule(updatedRuleStringWithVoucherData)

	// fmt.Printf("123%s\n", updatedRuleString)

	// dataContext := ast.NewDataContext()
	// err = dataContext.Add("Item", item)
	// if err != nil {
	// 	return err
	// }

	// ruleHelper := &RuleHelper{}
	// err = dataContext.Add("Helper", ruleHelper)
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

	encodedRuleValue := `cnVsZSAiVGVzdF9SZXdhcmRfUG9pbnRfVm91Y2hlciIgewogICAgICB3aGVuCiAgICAgICAgQ2FydC5Ub3RhbCA+PSAyMDAgJiYgQ2FydC5DdXJyZW5jeSA9PSAiVVNEIgogICAgICB0aGVuCiAgICAgICAgQ2FydC5SZXN1bHQgPSAiQ29uZGl0aW9uIG1ldCI7CiAgICAgICAgQ2FydC5NaW50UG9pbnQgPSBDYXJ0LlRvdGFsIC8gMTAwOwogICAgICAgIENhcnQuVm91Y2hlciA9IFsiZTNlOTQ4NWUtMjA1NS00NDNhLThkNDgtMWM2ZDVlYzdmMTg5Il07CiAgICAgICAgUmV0cmFjdCgiVGVzdF9SZXdhcmRfUG9pbnRfVm91Y2hlciIpOwogIH0=`

	err := applyRules(item, encodedRuleValue, "CartAmount", "0.1.0")
	if err != nil {
		log.Fatalf("Error applying rules: %v", err)
	}

	fmt.Printf("Item after rule execution: %+v\n", item)
}
