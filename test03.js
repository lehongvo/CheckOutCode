const functionTest = (encodedRule) => {
    const ruleString = Buffer.from(encodedRule, 'base64').toString('utf-8');
    console.log("===========> Your rule string is: \n" + ruleString);
}

// Test case
functionTest(
    "cnVsZSAiUmV3YXJkX1BvaW50X2FuZF9Wb3VjaGVyIiB7CiAgICAgIHdoZW4KICAgICAgICBDYXJ0LlRvdGFsID49IDIwMCAmJiBDYXJ0LkN1cnJlbmN5ID09ICJVU0QiCiAgICAgIHRoZW4KICAgICAgICBDYXJ0LlJlc3VsdCA9ICJDb25kaXRpb24gbWV0IjsKICAgICAgICBDYXJ0Lk1pbnRQb2ludCA9IENhcnQuVG90YWwgLyAxMDA7CiAgICAgICAgQ2FydC5Wb3VjaGVyID0gWyJlM2U5NDg1ZS0yMDU1LTQ0M2EtOGQ0OC0xYzZkNWVjN2YxODkiXTsKICAgICAgICBSZXRyYWN0KCJSZXdhcmRfUG9pbnRfYW5kX1ZvdWNoZXIiKTsKICB9="
)
