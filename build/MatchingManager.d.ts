import { ProducingAsset, ConsumingAsset, Demand, Certificate, BlockchainProperties } from 'ewf-coo';
import { Matcher } from './Matcher';
export declare class MatchingManager {
    private producingAssets;
    private consumingAssets;
    private demands;
    private certificatesHoldInTrust;
    private matcher;
    private blockchainProperties;
    constructor(blockchainProperties: BlockchainProperties);
    setMatcher(matcher: Matcher): void;
    match(assetId: number, wh: number): Promise<void>;
    matchDemandWithCertificatesHoldInTrust(demand: Demand): Promise<void>;
    registerProducingAsset(newAsset: ProducingAsset): Promise<void>;
    registerConsumingAsset(newAsset: ConsumingAsset): Promise<void>;
    registerDemand(newDemand: Demand): Promise<void>;
    registerCertificate(newCertificate: Certificate): Promise<void>;
    removeProducingAsset(assetId: number): Promise<void>;
    removeConsumingAsset(assetId: number): Promise<void>;
    removeDemand(demandId: number): Promise<void>;
    removeCertificate(certificateId: number): Promise<void>;
    getProducingAsset(assetId: number): Promise<ProducingAsset>;
    getConsumingAsset(assetId: number): Promise<ConsumingAsset>;
    createOrRefreshConsumingAsset(assetId: number): Promise<ConsumingAsset>;
    getDemand(demandId: number): Demand;
}
