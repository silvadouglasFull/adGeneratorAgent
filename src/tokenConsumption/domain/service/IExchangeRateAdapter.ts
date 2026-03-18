export interface IExchangeRateAdapter {
    getUSDtoBRL(): Promise<number>;
}
