import { useEffect, useState } from "react";

const COINGECKO_XLM_PRICE_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd";

export function useXlmUsdPrice() {
  const [price, setPrice] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    const loadPrice = async () => {
      try {
        const response = await fetch(COINGECKO_XLM_PRICE_URL);
        if (!response.ok) throw new Error("Unable to load XLM price.");
        const data = (await response.json()) as { stellar?: { usd?: number } };
        if (active) setPrice(data.stellar?.usd ?? null);
      } catch {
        if (active) setPrice(null);
      }
    };

    void loadPrice();
    const interval = window.setInterval(() => void loadPrice(), 60_000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  return price;
}
