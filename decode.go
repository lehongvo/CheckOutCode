//  Copyright hyperjumptech/grule-rule-engine Authors
//
//  Licensed under the Apache License, Version 2.0 (the "License");
//  you may not use this file except in compliance with the License.
//  You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS,
//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  See the License for the specific language governing permissions and
//  limitations under the License.

package main

import (
	"encoding/json"
	"fmt"

	"github.com/hyperjumptech/grule-rule-engine/ast"
	"github.com/hyperjumptech/grule-rule-engine/builder"
	"github.com/hyperjumptech/grule-rule-engine/engine"
	"github.com/hyperjumptech/grule-rule-engine/pkg"
)

// Define Go structs for the JSON data
type Address struct {
	Street string `json:"street"`
	City   string `json:"city"`
	State  string `json:"state"`
	Postal int    `json:"postal"`
}

type Person struct {
	Name    string   `json:"name"`
	Age     int      `json:"age"`
	Gender  string   `json:"gender"`
	Height  float64  `json:"height"`
	Married bool     `json:"married"`
	Address Address  `json:"address"`
	Friends []string `json:"friends"`
}

// Function to parse the JSON data into the Person struct
func parseJSONData() (*Person, error) {
	data := `{
		"name" : "John Doe",
		"age" : 24,
		"gender" : "M",
		"height" : 74.8,
		"married" : false,
		"address" : {
			"street" : "9886 2nd St.",
			"city" : "Carpentersville",
			"state" : "Illinois",
			"postal" : 60110
		},
		"friends" : [ "Roth", "Jane", "Jake" ]
	}`

	var person Person
	err := json.Unmarshal([]byte(data), &person)
	if err != nil {
		return nil, err
	}

	return &person, nil
}

// Main function
func main() {
	// Parse the JSON data
	person, err := parseJSONData()
	if err != nil {
		fmt.Println("Error parsing JSON:", err)
		return
	}

	// Print the parsed data
	fmt.Printf("Before Rule Execution:\n%+v\n\n", person)

	// Create the data context and add the parsed person
	dataContext := ast.NewDataContext()
	err = dataContext.Add("Person", person)
	if err != nil {
		fmt.Println("Error adding person to context:", err)
		return
	}

	// Define some rules
	rule := `
rule CheckPersonStatus "Check if the person is eligible" {
    when
        Person.Married == false && Person.Age < 30
    then
        Log("The person is eligible for the program.");
        Retract("CheckPersonStatus");
}
`
	// Create the knowledge library and rule builder
	lib := ast.NewKnowledgeLibrary()
	ruleBuilder := builder.NewRuleBuilder(lib)

	// Build the rule from the string
	err = ruleBuilder.BuildRuleFromResource("Test", "0.1.1", pkg.NewBytesResource([]byte(rule)))
	if err != nil {
		fmt.Println("Error building rule:", err)
		return
	}

	// Create a knowledge base instance
	kb, err := lib.NewKnowledgeBaseInstance("Test", "0.1.1")
	if err != nil {
		fmt.Println("Error creating knowledge base:", err)
		return
	}

	// Create and execute the rules engine
	eng1 := &engine.GruleEngine{MaxCycle: 1}
	err = eng1.Execute(dataContext, kb)
	if err != nil {
		fmt.Println("Error executing rules:", err)
		return
	}

	// Print the person data after rule execution
	fmt.Printf("\nAfter Rule Execution:\n%+v\n", person)
}
