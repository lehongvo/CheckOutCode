const ruleText = `
rule "Cart" {
    when
      Cart.total >= 500
    then
      Cart.Result = "Condition met";
      Cart.MintPoint = Cart.total / 1000;
      Cart.Voucher = true;
}`;

// Encode đoạn text thành base64
const encodedRuleText = Buffer.from(ruleText).toString('base64');
console.log("Encoded Rule Text:", encodedRuleText);

// Decode từ base64 trở lại đoạn text
// const decodedRuleText = Buffer.from(encodedRuleText, 'base64').toString('utf-8');
// console.log("Decoded Rule Text:", decodedRuleText);



