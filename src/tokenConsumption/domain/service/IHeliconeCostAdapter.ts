export interface IHeliconeCostAdapter {
    getCostByRequestId(heliconeRequestId: string): Promise<number>;
}
