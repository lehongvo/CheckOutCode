import { Engine, Rule } from 'json-rules-engine';
import * as rules from './rules.json';

enum Channel {
    Online,
    Offline,
    Marketplace,
    Partner,
}

enum Tier {
    Tier1,
    Tier2,
    Tier3,
    Tier4,
    Tier5,
}

interface Item {
    Total: number;
    Amount: number;
    PlaceOrderDate: number;
    SKU: string;
    Category: string;
    Attribute: Record<string, string>;
    Tier: Tier;
    RegisterDate: string;
    CLV: number;
    Channels: Channel[];
    StoreID: string;
    EventID: string;
    ReferralCode: string;
    GameID: string;
    MissionID: string;
    Result: string;
    MintPoint: number;
    Voucher: string[];
    Currency: string;
    DebugLog: string;
}

class RuleHelper {
    static addVoucher(item: Item, voucher: string): void {
        item.Voucher.push(voucher);
    }
}

async function applyRules(item: Item): Promise<void> {
    const engine = new Engine();

    // Load rules from the JSON file
    rules.forEach((rule: any) => engine.addRule(new Rule(rule)));

    const facts = {
        Item: item,
    };

    const result = await engine.run(facts);

    result.events.forEach(event => {
        const { params } = event;
        item.Result = params.Result;
        item.MintPoint = params.MintPoint;
        params.Voucher.forEach((voucher: string) => RuleHelper.addVoucher(item, voucher));
    });
}

async function main() {
    const item: Item = {
        Total: 10000000,
        Amount: 9000000,
        PlaceOrderDate: 1724235564,
        SKU: 'SKU1',
        Category: 'Iphone',
        Tier: Tier.Tier1,
        Channels: [Channel.Online, Channel.Offline],
        Currency: 'USD',
        DebugLog: '',
        Attribute: {},
        RegisterDate: '',
        CLV: 0,
        StoreID: '',
        EventID: '',
        ReferralCode: '',
        GameID: '',
        MissionID: '',
        Result: '',
        MintPoint: 0,
        Voucher: [],
    };

    await applyRules(item);

    console.log('Item after rule execution:', item);
}

main().catch(console.error);
