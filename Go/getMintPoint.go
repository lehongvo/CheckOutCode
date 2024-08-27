package main

import (
	"encoding/base64"
	"fmt"
	"regexp"
	"strings"
)

func getMintVoucher(encodedRule string) ([]string, error) {
	// Decode base64 encoded rule
	decodedBytes, err := base64.StdEncoding.DecodeString(encodedRule)
	if err != nil {
		return nil, fmt.Errorf("Error decoding base64: %v", err)
	}
	decodedRule := string(decodedBytes)

	// Regular expression to extract the Voucher array
	re := regexp.MustCompile(`Voucher\s*=\s*\[([^\]]+)\];`)
	matches := re.FindStringSubmatch(decodedRule)

	if len(matches) < 2 {
		return nil, fmt.Errorf("Voucher information not found")
	}

	// Extract the voucher strings and split them by comma
	vouchers := strings.Split(matches[1], ",")

	// Trim whitespace and quotes
	for i, voucher := range vouchers {
		vouchers[i] = strings.Trim(voucher, `" `)
	}

	return vouchers, nil
}

func main() {
	encodedRule := "cnVsZSAiQ2FydCAtIFRvdGFsIiB7CiAgICB3aGVuCiAgICAgIENhcnQuVG90YWwgPj0gNTAwICYmIENhcnQuQ3VycmVuY3kgPT0gIlVTRCIKICAgIHRoZW4KICAgICAgQ2FydC5SZXN1bHQgPSAiQ29uZGl0aW9uIG1ldCI7CiAgICAgIENhcnQuTWludFBvaW50ID0gQ2FydC5Ub3RhbCAvIDEwMDA7CiAgICAgIENhcnQuVm91Y2hlciA9IFsiOTgzaDJkMTkyODM3aDMyOGZvMjIzZjIiLCI5ODIzaDkyODPhu7M3MjM44buzaDIzZjIzaTk4NyJdOwogICAgICBSZXRyYWN0KCJDYXJ0IC0gVG90YWwiKTsKfQ=="

	// Get the voucher information
	vouchers, err := getMintVoucher(encodedRule)
	if err != nil {
		fmt.Println("Error:", err)
		return
	}

	// Format the output as a JSON-like array with quotes around each string
	formattedVouchers := fmt.Sprintf(`["%s"]`, strings.Join(vouchers, `", "`))
	fmt.Println("Voucher information:", formattedVouchers)
}
