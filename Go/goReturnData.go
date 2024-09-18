rule "test" {
    when
        (
            Cart.Total >= 100 && 
            Customer.CLV > 2000 && 
            Sources.Channels == Offline && 
            Sources.Source == London1
        ) == true
    then
        Cart.RedempVouchers = [
            {
                  Voucher.CollectionId = "0xABC";
                  Voucher.Currency = "USD";
                  Voucher.PercentDiscount = {percent_discount};
                  Voucher.FixedAmountDiscount = {fixed_amount};
                  Voucher.DiscountPercentAmount = Cart.Total * {percent_discount};
                  Retract("test");
            },
            {      
                  Voucher.CollectionId = "0xABC";
                  Voucher.SelectProductName= "Macbook"; 
                  Voucher.Category = "General"
                  Voucher.Currency = "USD" 
                  Voucher.DiscountPercent = {percent_discount_product};
                  Voucher.FixedAmountDiscount = {fixed_amount_product} * Product.Quantity;      
                  Voucher.DiscountPercentAmount = Product.Price * Product.Quantity * {percent_discount_product};         
                  Retract("test");
            }  
        ];          
        Cart.RedempPoints = [    
                {
                    Point.Currency = "USD";
                    Point.ConversionRate = {point_number}/{currency_number};
                    Retract("test");
                },
                {      
                    Point.SelectProductName = "Iphone"
                    Voucher.Category = "General"
                    Point.Currency = "USD"
                    Point.ConversionRate = {point_number_product}/{currency_number_product};
                    Retract("test");
                }
        ]        
}