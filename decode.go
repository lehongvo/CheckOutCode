package main

import (
	"fmt"
	"strings"
)

func transformRule(ruleString string) string {
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

// func main() {
// 	originalRule := `
// rule Get_point_and_voucher {
//       when
//         Item.Total >= 200 && Item.Currency == "undefined"
//       then
//         Item.Result = "Condition met";
//         Item.MintPoint = Item.Total / 100;
//         Item.Voucher = ["e3e9485e-2055-443a-8d48-1c6d5ec7f189", "e3e9485e-2055-443a-8d48-1c6d5ec7f189"];
//         Retract("Get_point_and_voucher");
//   }`

// 	// Biến đổi rule
// 	transformedRule := transformRule(originalRule)

// 	fmt.Println("Original Rule:")
// 	fmt.Println(originalRule)
// 	fmt.Println("\nTransformed Rule:")
// 	fmt.Println(transformedRule)
// }
