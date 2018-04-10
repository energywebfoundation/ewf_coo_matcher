// Copyright 2018 Energy Web Foundation
// This file is part of the Origin Application brought to you by the Energy Web Foundation,
// a global non-profit organization focused on accelerating blockchain technology across the energy sector, 
// incorporated in Zug, Switzerland.
//
// The Origin Application is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// This is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY and without an implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details, at <http://www.gnu.org/licenses/>.
//
// @authors: slock.it GmbH, Heiko Burkhardt, heiko.burkhardt@slock.it

import { Asset, ProducingAsset, ConsumingAsset, Demand, Certificate, BlockchainProperties } from 'ewf-coo'
import { Matcher } from './Matcher'
import { networkInterfaces } from 'os';

export class MatchingManager {
    private producingAssets: ProducingAsset[]
    private consumingAssets: ConsumingAsset[]
    private demands: Demand[]
    private certificatesHoldInTrust: Certificate[]
    private matcher: Matcher
    private blockchainProperties: BlockchainProperties


    constructor(blockchainProperties: BlockchainProperties) {
        
        this.producingAssets = []
        this.consumingAssets = []
        this.demands = []
        this.certificatesHoldInTrust = []
        this.blockchainProperties = blockchainProperties
    }

    setMatcher(matcher: Matcher) {
        this.matcher = matcher
    }

    async match(assetId: number, wh: number)  {
        
        console.log('\nTry to match ' + wh + ' Wh from asset ' + assetId)
        console.log('- Number of certificates hold in trust: ' + this.certificatesHoldInTrust.length)
        const asset = this.producingAssets.find((asset: Asset) => asset.id == assetId)
        if(asset) {
            this.matcher.match(wh, asset, this.demands)
        } else {
            //TODO: get asset
        }
        
    }

    async matchDemandWithCertificatesHoldInTrust(demand: Demand) {
        console.log('\nTry to fit demand ' + demand.id + ' with certificates hold in trust')
        console.log('- Number of certificates hold in trust: ' + this.certificatesHoldInTrust.length)
        this.matcher.matchDemandWithCertificatesHoldInTrust(demand, this.certificatesHoldInTrust)


    }

    async registerProducingAsset(newAsset: ProducingAsset) {
        const existingAsset = this.producingAssets.find((asset: Asset) => newAsset.id == asset.id)

        if (existingAsset) {
            await existingAsset.syncWithBlockchain()
        } else {
            this.producingAssets.push(newAsset)
            console.log('*> registered producing asset: ' + newAsset.id)
        }
    }

    async registerConsumingAsset(newAsset: ConsumingAsset) {
        const existingAsset = this.consumingAssets.find((asset: Asset) => newAsset.id == asset.id)

        if (existingAsset) {
            await existingAsset.syncWithBlockchain()
        } else {
            this.consumingAssets.push(newAsset)
            console.log('*> registered consuming asset: ' + newAsset.id)
        }
    }

    async registerDemand(newDemand: Demand) {
        const existingDemand = this.demands.find((demand: Demand) => newDemand.id == demand.id)

        if (existingDemand) {
            await existingDemand.syncWithBlockchain()
        } else {
           
            this.demands.push(newDemand)
            console.log('*> registered demand: ' + newDemand.id)
        }
    }

    async registerCertificate(newCertificate: Certificate) {
        const existingCertificate = this.certificatesHoldInTrust.find((certificate: Certificate) => newCertificate.id == certificate.id)

        if (existingCertificate) {
            await existingCertificate.syncWithBlockchain()
        } else {
            this.certificatesHoldInTrust.push(newCertificate)
            console.log('*> registered certificate hold in trust: ' + newCertificate.id)
        }
    }

    async removeProducingAsset(assetId: number) {
        const assetIndex = this.producingAssets.findIndex((asset: Asset) => assetId == asset.id)

        if(assetIndex !== -1) {
            this.producingAssets.splice(assetIndex, 1)
            console.log('*> removed producing asset: ' + assetId)
        }
    }

    async removeConsumingAsset(assetId: number) {
        const assetIndex = this.consumingAssets.findIndex((asset: Asset) => assetId == asset.id)

        if(assetIndex !== -1) {
            this.consumingAssets.splice(assetIndex, 1)
            console.log('*> removed consuming asset: ' + assetId)
        }
    }

    async removeDemand(demandId: number) {
        const demandIndex = this.demands.findIndex((demand: Demand) => demandId == demand.id)

        if(demandIndex !== -1) {
      
            this.demands.splice(demandIndex, 1)
            console.log('*> removed demand: ' + demandId)
        }
    }

    async removeCertificate(certificateId: number) {
        
        const certificateIndex = this.certificatesHoldInTrust.findIndex((certificate: Certificate) => certificateId == certificate.id)
        console.log('*> initiated removal of certificate ' + certificateId + ' at index ' + certificateIndex)
        const printCerts = () => {
            this.certificatesHoldInTrust.forEach((c: Certificate) => {
                console.log('***> cert: ' + c.id)
            })
        }

        if(certificateIndex !== -1) {
         
            this.certificatesHoldInTrust.splice(certificateIndex, 1)
            console.log('*> removed certificate hold in trust: ' + certificateId)
  
        }
    }

    async getProducingAsset(assetId: number): Promise<ProducingAsset> {
        let asset = this.producingAssets.find((asset: ProducingAsset) => asset.id == assetId)
        if (!asset) {
            asset = await (new ProducingAsset(assetId, this.blockchainProperties)).syncWithBlockchain()
        }
        return asset
    }

    async getConsumingAsset(assetId: number): Promise<ConsumingAsset> {
        let asset = this.consumingAssets.find((asset: ConsumingAsset) => asset.id == assetId)
        if (!asset) {
            asset = await (new ConsumingAsset(assetId, this.blockchainProperties)).syncWithBlockchain()
        }
        return asset
    }

    async createOrRefreshConsumingAsset(assetId: number): Promise<ConsumingAsset>{
        let assetIndex = this.consumingAssets.findIndex((asset: ConsumingAsset) => asset.id == assetId)
        if (assetIndex !== -1) {

            this.consumingAssets[assetId] = await this.consumingAssets[assetId].syncWithBlockchain()
            return this.consumingAssets[assetId]
        } else {
            let asset = await (new ConsumingAsset(assetId, this.blockchainProperties).syncWithBlockchain())
            this.consumingAssets.push(asset)
            return asset
        }

    }
    
    getDemand(demandId: number): Demand {
        return this.demands.find((demand: Demand) => demand.id == demandId)
    }
}