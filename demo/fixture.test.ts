import { describe, expect, it } from "vitest";
import { demoFixture } from "./fixture";

describe("fictional demo fixture", () => {
  it("keeps the worked-example totals consistent in integer cents", () => {
    const { today } = demoFixture;
    expect(today.sales).toBe(15000 + 20000);
    expect(today.netProfit).toBe(
      today.sales - today.costOfGoods - today.expenses,
    );
    expect(today.cash + today.mpesa).toBe(today.sales);
    expect(
      demoFixture.recentSales.reduce((sum, sale) => sum + sale.amount, 0),
    ).toBe(today.sales);
  });
});
