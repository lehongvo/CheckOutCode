const functionTest = (encodedRule) => {
    const ruleString = Buffer.from(encodedRule, 'base64').toString('utf-8');
    console.log("===========> Your rule string is: \n" + ruleString);
}

const decodeData = (encodedData) => {
    const data = Buffer.from(encodedData).toString('base64');
    console.log("===========> Your data is: \n" + data);
}

// // Test case
// functionTest(
//     "cnVsZSAiQ3JlYXRlX25ld19SZWRlbXB0aW9uX1J1bGVfNyIgewogICAgICB3aGVuCiAgICAgICAgQ2FydC5Ub3RhbCBub3QgaW4gMzAwCiAgICAgIHRoZW4KICAgICAgICBDYXJ0LlJlc3VsdCA9ICJDb25kaXRpb24gbWV0IjsKICAgICAgICBDYXJ0Lk1pbnRQb2ludCA9IFt7InBvaW50X2NhcnRfdG90YWwiOnsiY3VycmVuY3lfaWQiOiJVU0QiLCJwb2ludF9hbW91bnQiOiIiLCJ2YWx1ZSI6IiIsImFtb3VudF92YWx1ZSI6IiJ9LCJwb2ludF9wcm9kdWN0X3Jld2FyZCI6eyJjdXJyZW5jeV9pZCI6IlVTRCIsInByb2R1Y3RfbmFtZSI6MSwicG9pbnRfYW1vdW50IjoiIiwidmFsdWUiOiIiLCJhbW91bnRfdmFsdWUiOiIifX1dOwogICAgICAgIENhcnQuVm91Y2hlciA9IFt7ImNvbGxlY3Rpb25faWQiOiJlM2U5NDg1ZS0yMDU1LTQ0M2EtOGQ0OC0xYzZkNWVjN2YxODkiLCJwb2ludF9jYXJ0X3RvdGFsIjp7ImN1cnJlbmN5X2lkIjoiVVNEIiwidmFsdWUiOiIiLCJkaXNjb3VudF9yYXRlIjoiMTAifSwicG9pbnRfcHJvZHVjdF9yZXdhcmQiOnsiY3VycmVuY3lfaWQiOiJVU0QiLCJwcm9kdWN0X25hbWUiOnsiaWQiOjEsInZhbHVlIjoiTW91c2UgTG9naXRlY2giLCJsYWJlbCI6Ik1vdXNlIExvZ2l0ZWNoIn0sImRpc2NvdW50X3JhdGUiOiIiLCJ2YWx1ZSI6IjEwMCJ9fV07CiAgICAgICAgUmV0cmFjdCgiQ3JlYXRlX25ld19SZWRlbXB0aW9uX1J1bGVfNyIpOwogIH0="
// );
decodeData(
    `rule New_Point_Voucher {
when
    Cart.Total >= 200 && Cart.Currency == "USD"
then
    Cart.Result = "Condition met";
    Cart.MintPoint = Cart.Total / 100;
    Cart.Voucher = ["e3e9485e-2055-443a-8d48-1c6d5ec7f189"];
    Retract("New_-_Point_&_Voucher");
}`
)

// functionTest(
//     'cnVsZSBOZXdfLV9Qb2ludF8mX1ZvdWNoZXIgewp3aGVuCiAgICBDYXJ0LlRvdGFsID49IDIwMCAmJiBDYXJ0LkN1cnJlbmN5ID09ICJVU0QiCnRoZW4KICAgIENhcnQuUmVzdWx0ID0gIkNvbmRpdGlvbiBtZXQiOwogICAgQ2FydC5NaW50UG9pbnQgPSBDYXJ0LlRvdGFsIC8gMTAwOwogICAgQ2FydC5Wb3VjaGVyID0gWyJlM2U5NDg1ZS0yMDU1LTQ0M2EtOGQ0OC0xYzZkNWVjN2YxODkiXTsKICAgIFJldHJhY3QoIk5ld18tX1BvaW50XyZfVm91Y2hlciIpOwp9'
// )