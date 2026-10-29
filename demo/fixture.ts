/** Fictional, precomputed demo values. No account, database, or user records are involved. */
export const demoFixture = {
  businessName: "Achieng's Greens & Eggs",
  location: "Gikomba",
  period: "Sample day",
  today: {
    sales: 35000,
    costOfGoods: 9000,
    expenses: 5000,
    netProfit: 21000,
    cash: 15000,
    mpesa: 20000,
    deni: 0,
    cashShare: "43%",
    mpesaShare: "57%",
  },
  recentSales: [
    { item: "Sukuma wiki · 3 kilo", amount: 15000, payment: "Cash" },
    { item: "Trip Gikomba–Town", amount: 20000, payment: "M-Pesa" },
  ],
} as const;
