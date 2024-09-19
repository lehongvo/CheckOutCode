package main

import (
	"fmt"
	"log"

	"github.com/hyperjumptech/grule-rule-engine/ast"
	"github.com/hyperjumptech/grule-rule-engine/builder"
	"github.com/hyperjumptech/grule-rule-engine/engine"
	"github.com/hyperjumptech/grule-rule-engine/pkg"
)

type TotalHelper struct {
	ArrayA []int
}

func (th *TotalHelper) Contains(value int) bool {
	fmt.Printf("Checking if %d is in array: %v\n", value, th.ArrayA)
	for _, v := range th.ArrayA {
		if v == value {
			fmt.Println("Value found in array!")
			return true
		}
	}
	fmt.Println("Value not found in array.")
	return false
}

func (th *TotalHelper) SimpleCheck(value int) {
	if th.Contains(value) {
		fmt.Printf("Simple check: %d found in array\n", value)
	} else {
		fmt.Printf("Simple check: %d not found in array\n", value)
	}
}

func main() {
	totalHelper := &TotalHelper{
		ArrayA: []int{1, 2, 3, 4, 5}, // ArrayA chứa các giá trị
	}

	// Kiểm tra trực tiếp logic Contains
	found := totalHelper.Contains(1)
	log.Printf("Direct call to Contains: Value found: %v\n", found)

	// Tạo DataContext và đăng ký TotalHelper
	dataContext := ast.NewDataContext()
	err := dataContext.Add("TotalHelper", totalHelper) // Đăng ký TotalHelper vào DataContext
	if err != nil {
		log.Fatalf("Error adding TotalHelper to DataContext: %v", err)
	}

	// Định nghĩa rule sử dụng hàm SimpleCheck
	dsl := `
    rule CheckValueInArray "Check if value is in TotalHelper.ArrayA" {
        when
            true
        then
            TotalHelper.SimpleCheck(1);
            Log("Rule executed. Value checked in array.");
    }
    `

	// Tạo KnowledgeLibrary
	lib := ast.NewKnowledgeLibrary()

	// Tạo RuleBuilder với KnowledgeLibrary
	ruleBuilder := builder.NewRuleBuilder(lib)

	// Xây dựng rule từ dsl
	err = ruleBuilder.BuildRuleFromResource("MyKnowledgeBase", "0.0.1", pkg.NewBytesResource([]byte(dsl)))
	if err != nil {
		panic(err)
	}

	// Lấy KnowledgeBaseInstance và xử lý lỗi nếu có
	kb, err := lib.NewKnowledgeBaseInstance("MyKnowledgeBase", "0.0.1")
	if err != nil {
		panic(err)
	}

	// Tạo và chạy engine
	ruleEngine := engine.NewGruleEngine()
	err = ruleEngine.Execute(dataContext, kb)
	if err != nil {
		log.Fatalf("Error executing rule: %v", err)
	}

	fmt.Println("Rule executed successfully!")
}
