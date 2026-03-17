import { CostRecord } from "../model/CostRecord";

export interface ICostCaptureService {
    capture(heliconeRequestId: string): Promise<CostRecord>;
}
