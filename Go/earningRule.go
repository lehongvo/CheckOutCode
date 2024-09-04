package main

import (
	"fmt"

	"github.com/hyperjumptech/grule-rule-engine/ast"
	"github.com/hyperjumptech/grule-rule-engine/builder"
	"github.com/hyperjumptech/grule-rule-engine/engine"
	"github.com/hyperjumptech/grule-rule-engine/pkg"
	"github.com/stretchr/testify/assert"
)

const (
	rule2 = `
rule AgeNameCheck "test" {
    when
      Pogo.GetStringLength("9999") > 0  &&
      Pogo.Result == ""
    then
      Pogo.Result = "String len above 0";
}
`

	rule3 = `
rule AgeNameCheck "test"  salience 10{
    when
      Pogo.Compare(User.Name, "Calo")  
    then
      User.Name = "Success";
      Log(User.Name);
      Retract("AgeNameCheck");
}
`
)

// MyPoGo serve as example plain Old Go Object.
type MyPoGo struct {
	Result string
}

// GetStringLength will return the length of the provided string argument.
func (p *MyPoGo) GetStringLength(sarg string) int {
	return len(sarg)
}

// Compare will compare the equality between two strings.
func (p *MyPoGo) Compare(t1, t2 string) bool {
	fmt.Println(t1, t2)
	return t1 == t2
}

// User is an example user struct.
type User struct {
	Name string
	Age  int
	Male bool
}

// RunRule2 executes the second rule logic with MyPoGo and User.
func RunRule2() {
	user := &User{
		Name: "Calo",
		Age:  0,
		Male: true,
	}

	dataContext := ast.NewDataContext()
	err := dataContext.Add("User", user)
	if err != nil {
		fmt.Println("Error adding User:", err)
		return
	}
	err = dataContext.Add("Pogo", &MyPoGo{})
	if err != nil {
		fmt.Println("Error adding Pogo:", err)
		return
	}

	lib := ast.NewKnowledgeLibrary()
	ruleBuilder := builder.NewRuleBuilder(lib)

	err = ruleBuilder.BuildRuleFromResource("Test", "0.1.1", pkg.NewBytesResource([]byte(rule3)))
	if err != nil {
		fmt.Println("Error building rule:", err)
		return
	}

	kb, err := lib.NewKnowledgeBaseInstance("Test", "0.1.1")
	if err != nil {
		fmt.Println("Error creating knowledge base:", err)
		return
	}

	eng1 := &engine.GruleEngine{MaxCycle: 100}
	err = eng1.Execute(dataContext, kb)
	if err != nil {
		fmt.Println("Error executing rule:", err)
		return
	}

	fmt.Println("User:", user)
	assert.Equal(nil, "Success", user.Name)
	fmt.Println("User name after rule:", user.Name)
}

// main function to run the rules.
func main() {
	fmt.Println("\nRunning Rule 2...")
	RunRule2()
}
