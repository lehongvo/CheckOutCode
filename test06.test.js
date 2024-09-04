const functionTest = (encodedRule) => {
    const ruleString = Buffer.from(encodedRule, 'base64').toString('utf-8');
    console.log("===========> Your rule string is: \n" + ruleString);
}

// Test case
functionTest(
    "cnVsZSAiQ3JlYXRlX25ld19SZWRlbXB0aW9uX1J1bGVfNyIgewogICAgICB3aGVuCiAgICAgICAgQ2FydC5Ub3RhbCBub3QgaW4gMzAwCiAgICAgIHRoZW4KICAgICAgICBDYXJ0LlJlc3VsdCA9ICJDb25kaXRpb24gbWV0IjsKICAgICAgICBDYXJ0Lk1pbnRQb2ludCA9IFt7InBvaW50X2NhcnRfdG90YWwiOnsiY3VycmVuY3lfaWQiOiJVU0QiLCJwb2ludF9hbW91bnQiOiIiLCJ2YWx1ZSI6IiIsImFtb3VudF92YWx1ZSI6IiJ9LCJwb2ludF9wcm9kdWN0X3Jld2FyZCI6eyJjdXJyZW5jeV9pZCI6IlVTRCIsInByb2R1Y3RfbmFtZSI6MSwicG9pbnRfYW1vdW50IjoiIiwidmFsdWUiOiIiLCJhbW91bnRfdmFsdWUiOiIifX1dOwogICAgICAgIENhcnQuVm91Y2hlciA9IFt7ImNvbGxlY3Rpb25faWQiOiJlM2U5NDg1ZS0yMDU1LTQ0M2EtOGQ0OC0xYzZkNWVjN2YxODkiLCJwb2ludF9jYXJ0X3RvdGFsIjp7ImN1cnJlbmN5X2lkIjoiVVNEIiwidmFsdWUiOiIiLCJkaXNjb3VudF9yYXRlIjoiMTAifSwicG9pbnRfcHJvZHVjdF9yZXdhcmQiOnsiY3VycmVuY3lfaWQiOiJVU0QiLCJwcm9kdWN0X25hbWUiOnsiaWQiOjEsInZhbHVlIjoiTW91c2UgTG9naXRlY2giLCJsYWJlbCI6Ik1vdXNlIExvZ2l0ZWNoIn0sImRpc2NvdW50X3JhdGUiOiIiLCJ2YWx1ZSI6IjEwMCJ9fV07CiAgICAgICAgUmV0cmFjdCgiQ3JlYXRlX25ld19SZWRlbXB0aW9uX1J1bGVfNyIpOwogIH0="
);

"Create_new_Redemption_Rule_7" {
    when
    Cart.Total not in 300
    then
    Cart.Result = "Condition met";
    Cart.MintPoint = [{ "point_cart_total": { "currency_id": "USD", "point_amount": "", "value": "", "amount_value": "" }, "point_product_reward": { "currency_id": "USD", "product_name": 1, "point_amount": "", "value": "", "amount_value": "" } }];
    Cart.Voucher = [{ "collection_id": "e3e9485e-2055-443a-8d48-1c6d5ec7f189", "point_cart_total": { "currency_id": "USD", "value": "", "discount_rate": "10" }, "point_product_reward": { "currency_id": "USD", "product_name": { "id": 1, "value": "Mouse Logitech", "label": "Mouse Logitech" }, "discount_rate": "", "value": "100" } }];
    Retract("Create_new_Redemption_Rule_7");
}