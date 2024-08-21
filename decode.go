package main

import (
	"encoding/base64"
	"fmt"
	"strings"
)

func ruleEngineDecode1(encodedRuleText string) (string, error) {
	encodedRuleText = strings.TrimSpace(encodedRuleText)

	if len(encodedRuleText)%4 != 0 {
		encodedRuleText += strings.Repeat("=", 4-len(encodedRuleText)%4)
	}

	decodedBytes, err := base64.StdEncoding.DecodeString(encodedRuleText)
	if err != nil {
		return "", err
	}
	return string(decodedBytes), nil
}

func main1() {
	// Giả sử đây là encodedRuleText từ TypeScript
	encodedRuleText := "cnVsZSAiQ2FydCIgewogICAgd2hlbgogICAgICBDYXJ0LnRvdGFsID49IDUwMAogICAgdGhlbgogICAgICBDYXJ0LlJlc3VsdCA9ICJDb25kaXRpb24gbWV0IjsKICAgICAgQ2FydC5NaW50UG9pbnQgPSBDYXJ0LnRvdGFsIC8gMTAwMDsKICAgICAgQ2FydC5Wb3VjaGVyID0gdHJ1ZTsKfQ=="

	// Decode rule text
	decodedRuleText, err := ruleEngineDecode(encodedRuleText)
	if err != nil {
		fmt.Println("Error decoding:", err)
	} else {
		fmt.Println("Decoded Rule Text:", decodedRuleText)
	}
}
