rule Rule1 "Rule 1" {
    when
        (Item.Total >= 100 &&
            Item.CLV > 2000 &&
            Item.Channels[0] == 1 && // Offline = 1
            Item.Source == "London1" &&
            Item.Currency == "USD") == true
    then
    Item.RedempPoints[0].BasedPoint = 10;
    Item.RedempPoints[0].ConvertedDiscount = 5;
    Item.RedempPoints[0].PointToConvert = Item.RedempPoints[0].ConvertedDiscount / Item.RedempPoints[0].BasedPoint;

    Item.RedempVouchers[0].CollectionId = "0xAAA";
    Item.RedempVouchers[0].PercentDiscount = 0.05;
    Item.RedempVouchers[0].DiscountAmount = Item.Total * Item.RedempVouchers[0].PercentDiscount;

    Item.RedempVouchers[1].CollectionId = "0xBBB";
    Item.RedempVouchers[1].FixedAmountDiscount = 10;
    Item.RedempVouchers[1].DiscountAmount = Item.RedempVouchers[1].FixedAmountDiscount;

    Retract("Rule1");
}

rule Ruleư "Rule 2" {
    when
        (Item.Total >= 100 &&
            Item.CLV > 2000 &&
            Item.Channels[0] == 1 &&
            Item.Source == "London1" &&
            Item.Currency == "USD") == true
    then
    Item.RedempPoints[0].BasedPoint = 10;
    Item.RedempPoints[0].ConvertedDiscount = 5;
    Item.RedempPoints[0].PointToConvert = Item.RedempPoints[0].ConvertedDiscount / Item.RedempPoints[0].BasedPoint;
    Retract("Rule1");
}

rule Rule2SKU1 "Rule 3 - Product SKU1" {
    when
        (Item.Total >= 100 &&
            Item.CLV > 2000 &&
            Item.Channels[0] == 1 &&
            Item.Source == "London1" &&
            Item.Currency == "USD" &&
            Helper.Contains(Item.Products[0].Category, "New Collection") &&
            Product.SKU == "SKU1") == true
    then
    Item.RedempPoints[0].ConversionRate = 1;
    Item.RedempPoints[0].PointToConvert = Item.RedempPoints[0].ConversionRate;

    Item.RedempVouchers[0].CollectionId = "0xCCC";
    Item.RedempVouchers[0].PercentDiscount = 0.05;
    Item.RedempVouchers[0].DiscountAmount = Item.Price * Item.Quantity * Item.RedempVouchers[0].PercentDiscount;

    Retract("Rule2SKU1");
}