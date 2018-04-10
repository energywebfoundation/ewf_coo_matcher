import { Matcher } from './Matcher';
import { ProducingAsset, Demand, BlockchainProperties, Certificate } from 'ewf-coo';
import { MatchingManager } from './MatchingManager';
export declare class SimpleMatcher extends Matcher {
    blockchainProperties: BlockchainProperties;
    matchingManager: MatchingManager;
    constructor(blockchainProperties: BlockchainProperties, matchingManager: MatchingManager);
    static SLEEP(ms: any): Promise<{}>;
    match(wh: number, asset: ProducingAsset, demands: Demand[]): Promise<number>;
    matchDemandWithCertificatesHoldInTrust(demand: Demand, certificatesHoldInTrust: Certificate[]): Promise<void>;
    private buildDemandList(demands, assetId);
    private sendMatchTx(demand, assetId, whFit);
    private creatAssetOwnerCertificate(wh, assetId);
    private tryToFitAssetAndDemand(wh, asset, demand, certificate);
}
