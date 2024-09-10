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

	Currency string
	DebugLog string
}

// RuleHelper structure with a method to add multiple vouchers
type RuleHelper struct{}

func (r *RuleHelper) AddVoucher(item *Item, vouchers ...string) {
	item.Voucher = append(item.Voucher, vouchers...)
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
	var collectionIDs []string
	skipBlock := false

	for _, line := range lines {
		trimmedLine := strings.TrimSpace(line)

		// Detect start of the RedempPoint block and skip it
		if strings.Contains(trimmedLine, "Cart.RedempPoint = [") {
			skipBlock = true
		}
		if skipBlock {
			if strings.Contains(trimmedLine, "];") {
				skipBlock = false
			}
			continue // Skip the entire RedempPoint block
		}

		// Handle the Cart.RedempVoucher block
		if strings.Contains(trimmedLine, "Cart.RedempVoucher = [") {
			collectionIDs = []string{} // Reset for safety
			continue
		} else if strings.Contains(trimmedLine, "Cart.CollectionId:") {
			id := strings.Split(trimmedLine, ":")[1]
			id = strings.Trim(id, " ,\"")
			collectionIDs = append(collectionIDs, id)
			continue
		} else if strings.Contains(trimmedLine, "];") {
			if len(collectionIDs) > 0 {
				// Append the Helper.AddVoucher call after collecting all IDs
				outputLines = append(outputLines, fmt.Sprintf("        Helper.AddVoucher(Item, \"%s\")", strings.Join(collectionIDs, "\", \"")))
			}
			continue
		}

		// Append lines that are outside any specific blocks
		outputLines = append(outputLines, line)
	}

	return strings.Join(outputLines, "\n")
}

func applyRules(item *Item, encodedRuleValue string, ruleName string, version string) error {
	ruleString, err := ruleEngineDecode(encodedRuleValue)
	if err != nil {
		return fmt.Errorf("Error decoding rule: %v", err)
	}

	// Transform the rule string to remove the RedempPoint section
	transformedRuleString := helperTransformRule(ruleString)

	fmt.Printf("Transformed rule: \n%s\n", transformedRuleString)

	// Further rule processing can be added here

	return nil
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
