package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"

	"github.com/hyperjumptech/grule-rule-engine/ast"
	"github.com/hyperjumptech/grule-rule-engine/builder"
	"github.com/hyperjumptech/grule-rule-engine/engine"
	"github.com/hyperjumptech/grule-rule-engine/pkg"
	"github.com/julienschmidt/httprouter"
)

type Rule struct {
	Name       string `json:"name"`
	Version    string `json:"version"`
	RuleString string `json:"ruleString"`
}

var rulesStorage = struct {
	sync.RWMutex
	data map[string]Rule
}{data: make(map[string]Rule)}

// func main() {
// 	router := httprouter.New()
// 	router.POST("/api/rules", createRule)
// 	router.GET("/api/rules/:name", getRule)
// 	router.POST("/api/rules/check", checkRules)

// 	log.Println("Server is running on port 3000")
// 	log.Fatal(http.ListenAndServe(":3000", router))
// }

func createRule(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	var rule Rule
	err := json.NewDecoder(r.Body).Decode(&rule)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if rule.Name == "" || rule.Version == "" || rule.RuleString == "" {
		http.Error(w, "Name, version, and ruleString are required", http.StatusBadRequest)
		return
	}

	rulesStorage.Lock()
	rulesStorage.data[rule.Name] = rule
	rulesStorage.Unlock()

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": fmt.Sprintf("Rule '%s' created successfully", rule.Name)})
}

func getRule(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	ruleName := ps.ByName("name")

	rulesStorage.RLock()
	rule, exists := rulesStorage.data[ruleName]
	rulesStorage.RUnlock()

	if !exists {
		http.Error(w, fmt.Sprintf("Rule '%s' not found", ruleName), http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(rule)
}

func checkRules(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	var facts map[string]interface{}
	err := json.NewDecoder(r.Body).Decode(&facts)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	fmt.Println("Facts received:", facts)

	dataContext := ast.NewDataContext()
	for key, value := range facts {
		err := dataContext.Add(key, value)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	kb := ast.NewKnowledgeLibrary()
	ruleBuilder := builder.NewRuleBuilder(kb)

	rulesStorage.RLock()
	for _, rule := range rulesStorage.data {
		resource := pkg.NewBytesResource([]byte(rule.RuleString))
		err = ruleBuilder.BuildRuleFromResource(rule.Name, rule.Version, resource)
		if err != nil {
			http.Error(w, fmt.Sprintf("Failed to build rule '%s': %v", rule.Name, err), http.StatusInternalServerError)
			return
		}
	}

	rulesStorage.RUnlock()

	for _, rule := range rulesStorage.data {
		fmt.Println("Attempting to create KnowledgeBase instance for:", rule.Name, rule.Version)
		knowledgeBase, err := kb.NewKnowledgeBaseInstance(rule.Name, rule.Version)
		if err != nil {
			http.Error(w, fmt.Sprintf("Failed to create knowledge base for rule '%s': %v", rule.Name, err), http.StatusInternalServerError)
			return
		}

		eng := engine.NewGruleEngine()
		eng.MaxCycle = 1000

		fmt.Println("Rule execution started for:", rule.Name)
		err = eng.Execute(dataContext, knowledgeBase)
		if err != nil {
			http.Error(w, fmt.Sprintf("Failed to execute rule engine for rule '%s': %v", rule.Name, err), http.StatusInternalServerError)
			return
		}
	}

	fmt.Println("Facts after rule execution:", facts)

	json.NewEncoder(w).Encode(facts)
}
