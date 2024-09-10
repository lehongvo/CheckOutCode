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
	collectingVouchers := false

	for _, line := range lines {
		trimmedLine := strings.TrimSpace(line)

		if strings.Contains(trimmedLine, "Cart.RedempVoucher = [") {
			collectingVouchers = true
			continue // Start collecting and skip this line
		}

		if collectingVouchers {
			if strings.Contains(trimmedLine, "Cart.CollectionId:") {
				// Extract the ID value
				parts := strings.Split(trimmedLine, ":")
				if len(parts) > 1 {
					id := strings.Trim(parts[1], " ,\"")
					collectionIDs = append(collectionIDs, id)
				}
			}

			if strings.Contains(trimmedLine, "];") {
				collectingVouchers = false // Stop collecting
				// Add a line to call Helper.AddVoucher with the collected IDs
				outputLines = append(outputLines, fmt.Sprintf("        Helper.AddVoucher(Item, \"%s\")", strings.Join(collectionIDs, "\", \"")))
				continue
			}
		} else {
			outputLines = append(outputLines, line) // Add non-voucher lines as is
		}
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

	encodedRuleValue := `cnVsZSAiZmFzZHMiIHsKICAgICAgd2hlbgogICAgICAgIENhcnQuVG90YWwgPT0gMQogICAgICB0aGVuCiAgICAgICAgQ2FydC5SZXN1bHQgPSAiQ29uZGl0aW9uIG1ldCI7CiAgICAgICAgQ2FydC5SZWRlbXBQb2ludCA9IFsKICAgICAgICAgICAgewogICAgICAgICAgICAgIENhcnQuSXNDYXJ0VG90YWw6IHRydWUsCiAgICAgICAgICAgICAgQ2FydC5Qb2ludEFtb3VudDogIjAiLAogICAgICAgICAgICAgIENhcnQuQ3VycmVuY3k6ICJWTkQiLAogICAgICAgICAgICAgIENhcnQuTWludFBvaW50OiAxMQogICAgICAgICAgICB9LAogICAgICAgICAgICB7CiAgICAgICAgICAgICAgQ2FydC5Jc0NhcnRUb3RhbDogZmFsc2UsCiAgICAgICAgICAgICAgIENhcnQuUHJvZHVjdE5hbWU6ICJLZXkgRkwgU3BvcnQiLAogICAgICAgICAgICAgIENhcnQuUG9pbnRBbW91bnQ6ICIyIiwKICAgICAgICAgICAgICBDYXJ0LkN1cnJlbmN5OiAiVVNEIiwKICAgICAgICAgICAgICBDYXJ0Lk1pbnRQb2ludDogNAogICAgICAgICAgICB9XTsKICAgICAgICBDYXJ0LlJlZGVtcFZvdWNoZXIgPSBbCiAgICAgICAgICAgIHsKICAgICAgICAgICAgICBDYXJ0LkNvbGxlY3Rpb25JZDogIjNiOTY5MzE2LTVkZjMtNDIwZS1iNzhlLTk5OTJiMTkwMDZmOCIsCiAgICAgICAgICAgICAgQ2FydC5Jc0NhcnRUb3RhbDogZmFsc2UsCiAgICAgICAgICAgICAgQ2FydC5Qcm9kdWN0TmFtZTogIk1vdXNlIExvZ2l0ZWNoIiwKICAgICAgICAgICAgICBDYXJ0LlRvdGFsOiBDYXJ0LlRvdGFsIC0gMSwKICAgICAgICAgICAgICBDYXJ0LkN1cnJlbmN5OiAiVk5EIiwKICAgICAgICAgICAgfSwKICAgICAgICAgICAgewogICAgICAgICAgICAgIENhcnQuQ29sbGVjdGlvbklkOiAiZDcwZGE2ZDUtZGJmYS00ZmU1LThhNWQtNjRiMjA1OGM0OGYwIiwKICAgICAgICAgICAgICBDYXJ0LklzQ2FydFRvdGFsOiB0cnVlLAogICAgICAgICAgICAgIENhcnQuVG90YWw6IENhcnQuVG90YWwgKiAwLjg4LAogICAgICAgICAgICB9XTsKICAgICAgICBSZXRyYWN0KCJmYXNkcyIpOwogIH0`

	err := applyRules(item, encodedRuleValue, "CartAmount", "0.1.0")
	if err != nil {
		log.Fatalf("Error applying rules: %v", err)
	}

	fmt.Printf("Item after rule execution: %+v\n", item)
}
