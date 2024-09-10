const functionTest = (encodedRuleParams) => {
    const ruleString = Buffer.from(encodedRuleParams, 'base64').toString('utf-8');
    console.log(ruleString); // Debugging output to see the decoded rule string

    const convertToJsonArray = (arrayStr) => {
        return arrayStr
            .replace(/([a-zA-Z0-9_.]+)\s*:/g, '"$1":') // Properly quote JSON keys
            .replace(/'([^']+)'/g, '"$1"') // Convert single to double quotes for JSON strings
            .replace(/,\s*([}\]])/g, '$1') // Remove trailing commas
            .replace(/([\{\[])\s*,/g, '$1') // Remove leading commas
            .replace(/:\s*([a-zA-Z_]+[a-zA-Z0-9_.]*)\s*([,}\]])/g, ': "$1"$2') // Quote unquoted non-numeric values
            .replace(/:\s*([\d\.\-]+)\s*([\-\+*\/])\s*([\d\.\-]+)/g, ': "$1 $2 $3"') // Correctly encapsulate mathematical expressions as strings
            .replace(/:\s*(Cart\.Total\s*[\-\+*\/]\s*[\d\.]+)/g, ':"$1"'); // Specifically handle cases with Cart.Total operations
    };

    const extractAndConvertArray = (rule, key) => {
        const pattern = new RegExp(`${key}\\s*=\\s*\\[([^\\]]+)\\]`, 'g');
        const match = pattern.exec(rule);
        if (match) {
            const formattedArray = convertToJsonArray(match[1]);
            return JSON.parse(`[${formattedArray}]`);
        }
        return [];
    };

    const redempPoint = extractAndConvertArray(ruleString, "RedempPoint");
    const redempVoucher = extractAndConvertArray(ruleString, "RedempVoucher");

    return { RedempPoint: redempPoint, RedempVoucher: redempVoucher };
};

// Example use of the function with base64 encoded rule data
const encodedData = 'cnVsZSAiZmFzZHMiIHsKICAgICAgd2hlbgogICAgICAgIENhcnQuVG90YWwgPT0gMQogICAgICB0aGVuCiAgICAgICAgQ2FydC5SZXN1bHQgPSAiQ29uZGl0aW9uIG1ldCI7CiAgICAgICAgQ2FydC5SZWRlbXBQb2ludCA9IFsKICAgICAgICAgICAgewogICAgICAgICAgICAgIENhcnQuSXNDYXJ0VG90YWw6IHRydWUsCiAgICAgICAgICAgICAgQ2FydC5Qb2ludEFtb3VudDogIjAiLAogICAgICAgICAgICAgIENhcnQuQ3VycmVuY3k6ICJWTkQiLAogICAgICAgICAgICAgIENhcnQuTWludFBvaW50OiAxMQogICAgICAgICAgICB9LAogICAgICAgICAgICB7CiAgICAgICAgICAgICAgQ2FydC5Jc0NhcnRUb3RhbDogZmFsc2UsCiAgICAgICAgICAgICAgIENhcnQuUHJvZHVjdE5hbWU6ICJLZXkgRkwgU3BvcnQiLAogICAgICAgICAgICAgIENhcnQuUG9pbnRBbW91bnQ6ICIyIiwKICAgICAgICAgICAgICBDYXJ0LkN1cnJlbmN5OiAiVVNEIiwKICAgICAgICAgICAgICBDYXJ0Lk1pbnRQb2ludDogNAogICAgICAgICAgICB9XTsKICAgICAgICBDYXJ0LlJlZGVtcFZvdWNoZXIgPSBbCiAgICAgICAgICAgIHsKICAgICAgICAgICAgICBDYXJ0LkNvbGxlY3Rpb25JZDogIjNiOTY5MzE2LTVkZjMtNDIwZS1iNzhlLTk5OTJiMTkwMDZmOCIsCiAgICAgICAgICAgICAgQ2FydC5Jc0NhcnRUb3RhbDogZmFsc2UsCiAgICAgICAgICAgICAgQ2FydC5Qcm9kdWN0TmFtZTogIk1vdXNlIExvZ2l0ZWNoIiwKICAgICAgICAgICAgICBDYXJ0LlRvdGFsOiBDYXJ0LlRvdGFsIC0gMSwKICAgICAgICAgICAgICBDYXJ0LkN1cnJlbmN5OiAiVk5EIiwKICAgICAgICAgICAgfSwKICAgICAgICAgICAgewogICAgICAgICAgICAgIENhcnQuQ29sbGVjdGlvbklkOiAiZDcwZGE2ZDUtZGJmYS00ZmU1LThhNWQtNjRiMjA1OGM0OGYwIiwKICAgICAgICAgICAgICBDYXJ0LklzQ2FydFRvdGFsOiB0cnVlLAogICAgICAgICAgICAgIENhcnQuVG90YWw6IENhcnQuVG90YWwgKiAwLjg4LAogICAgICAgICAgICB9XTsKICAgICAgICBSZXRyYWN0KCJmYXNkcyIpOwogIH0';
const result = functionTest(encodedData);
console.log(result);
