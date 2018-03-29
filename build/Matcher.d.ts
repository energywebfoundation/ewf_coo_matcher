import { Asset, Demand, Certificate } from 'ewf-coo';
export declare abstract class Matcher {
    abstract match(wh: number, asset: Asset, demands: Demand[]): Promise<number>;
    abstract matchDemandWithCertificatesHoldInTrust(demand: Demand, certificatesHoldInTrust: Certificate[]): any;
}
