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

import { Matcher } from './Matcher'
import { Asset, ProducingAsset, Demand, BlockchainProperties, General, Certificate   } from 'ewf-coo'
import { MatchingManager } from './MatchingManager'


export class SimpleMatcher extends Matcher {
    blockchainProperties: BlockchainProperties
    matchingManager: MatchingManager
    

    constructor(blockchainProperties: BlockchainProperties, matchingManager: MatchingManager) {
        super()
        this.blockchainProperties = blockchainProperties
        this.matchingManager = matchingManager
    }

    static SLEEP(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async match(wh: number, asset: ProducingAsset, demands: Demand[]) :Promise<number> {
        const blockTimestamp = (await this.blockchainProperties.web3.eth.getBlock('latest')).timestamp
        console.log('- Time: ' + new Date(blockTimestamp*1000))

     
        if (!asset.initialized) {
            console.log('- Asset not initialized yet')
            return wh
        }

        const sortedDemandList = this.buildDemandList(demands, asset.id)

        let i = 0
        while (wh > 0 && i < sortedDemandList.length) {
            const whFit = await this.tryToFitAssetAndDemand(wh, asset, sortedDemandList[i], null)
            if (whFit > 0) {
                wh -= await this.sendMatchTx(sortedDemandList[i], asset.id, whFit)
            }
            i++;

        }

        if (wh > 0) {
            this.creatAssetOwnerCertificate(wh, asset.id)
        }

        asset.syncWithBlockchain()

        return wh;
    }

    async matchDemandWithCertificatesHoldInTrust(demand: Demand, certificatesHoldInTrust: Certificate[]) {
        const sortedCertificates = certificatesHoldInTrust.sort((a: Certificate, b: Certificate) => b.powerInW - a.powerInW)

        for(let i = 0; i < sortedCertificates.length; i++) {
            
            const certificate = sortedCertificates[i]
            const wh = await this.tryToFitAssetAndDemand(certificate.powerInW, await this.matchingManager.getProducingAsset(certificate.assetId), demand, certificate)
            if(wh === certificate.powerInW) {
                console.log('> Certificate ' + certificate.id + ' fits and provides ' + certificate.powerInW + ' from demanded ' + demand.targetWhPerPeriod + ' Wh')
                await demand.matchCertificate(certificate.id)
                await SimpleMatcher.SLEEP(1000)
                await demand.syncWithBlockchain()
                
            }
        }

    }

    private buildDemandList(demands: Demand[], assetId: number) {
        const timelyCoupledDemands = demands.filter((demand: Demand) => {
            //console.log(demand.coupled + ' ' + demand.productingAsset + ' ' + asset.id)
            return demand.getBitFromDemandMask(7) && demand.initialized
        })

        const coupledDemands = demands.filter((demand: Demand) => {
            //console.log(demand.coupled + ' ' + demand.productingAsset + ' ' + asset.id)
            return !demand.getBitFromDemandMask(7) && demand.getBitFromDemandMask(6) && demand.productingAsset === assetId && demand.initialized
        })

        const uncoupledDemands = demands.filter((demand: Demand) => {
            return !demand.getBitFromDemandMask(7) && !demand.getBitFromDemandMask(6)  && demand.initialized
        })

        console.log('- Timly coupled demands: ' + timelyCoupledDemands.length)
        console.log('- Coupled demands: ' + coupledDemands.length)
        console.log('- Uncoupled demands: ' + uncoupledDemands.length)

        return timelyCoupledDemands.concat(coupledDemands.concat(uncoupledDemands))
    }

    private async sendMatchTx(demand: Demand, assetId: number, whFit: number) {
        try {

            await demand.matchDemand(whFit, assetId)
            console.log('> Matched ' + whFit + ' Wh to demand ' + demand.id)
            await demand.syncWithBlockchain()
            return whFit
        } catch (e) {
            console.log('! Error while matching ' + whFit + ' Wh from asset ' + assetId + ' to demand ' + demand.id)
            console.log('  ' + e.message)

            return 0
        }
    }

    private async creatAssetOwnerCertificate(wh: number, assetId: number) {
        console.log('> No match found for ' + wh + ' Wh')
        try {
            await General.createCertificateForAssetOwner(this.blockchainProperties, wh, assetId)
            console.log('> Created certificate for asset owner with ' + wh + ' Wh')
        } catch (e) {
            console.log('! Error while creating certificate for asset owner with ' + wh + ' Wh from asset ' + assetId)
            console.log('  ' + e.message)
        }
    }

    private async tryToFitAssetAndDemand(wh: number, asset: ProducingAsset, demand: Demand, certificate: Certificate): Promise<number> {

        const blockTimestamp = (await this.blockchainProperties.web3.eth.getBlock('latest')).timestamp
        await asset.syncWithBlockchain()
        if(demand.endTime <= blockTimestamp || demand.startTime > blockTimestamp) {
            this.matchingManager.removeDemand(demand.id)
            return 0
        }

       
        if (!certificate && ((demand.getBitFromDemandMask(5) && demand.minCO2Offset > (asset.getCoSaved(wh)/ wh) * 100))) {
   
            return 0;
        } else if (certificate && ((demand.getBitFromDemandMask(5) && demand.minCO2Offset > (certificate.coSaved / certificate.powerInW ) * 100))) {
          
            return 0;
        }
 

        if ((demand.getBitFromDemandMask(4) && demand.locationRegion !== asset.region)
            || (demand.getBitFromDemandMask(1) && demand.assettype !== asset.assetType)
            || (demand.getBitFromDemandMask(3) && demand.locationCountry !== asset.country)
            || demand.matcher !== this.blockchainProperties.matcherAccount
            || (demand.getBitFromDemandMask(2) && demand.registryCompliance !== asset.complianceRegistry)
            || (demand.getBitFromDemandMask(0) && demand.originator !== asset.owner)
            || (demand.getBitFromDemandMask(6) && demand.productingAsset !== asset.id)
           // || (demand.getBitFromDemandMask(5) && demand.minCO2Offset > ((asset.getCoSaved(wh) * 1000) / wh)/10)

        ) {

            // console.log(demand.getBitFromDemandMask(4) && demand.locationRegion !== asset.region)
            // console.log(demand.getBitFromDemandMask(1) && demand.assettype !== asset.assetType)
            // console.log(demand.getBitFromDemandMask(3) && demand.locationCountry !== asset.country)
            // console.log(demand.matcher !== this.blockchainProperties.matcherAccount)
            // console.log(demand.getBitFromDemandMask(2) && demand.registryCompliance !== asset.complianceRegistry)
            // console.log(demand.getBitFromDemandMask(0) && demand.originator !== asset.owner)
            // console.log(demand.getBitFromDemandMask(6) && demand.productingAsset !== asset.id)
            // console.log(demand.getBitFromDemandMask(5) && demand.minCO2Offset < ((asset.getCoSaved(wh) * 1000) / wh)/10)
            // console.log(demand.minCO2Offset + ' > ' + ((asset.getCoSaved(wh) * 1000) / wh)/10)
            return 0
        }

        let consumedWh = Infinity

        if (demand.getBitFromDemandMask(7) ) {
            const consumingAsset = await (await this.matchingManager.getConsumingAsset(demand.consumingAsset)).syncWithBlockchain()

            consumedWh = Math.min(consumingAsset.lastSmartMeterReadWh - consumingAsset.certificatesUsedForWh, consumingAsset.capacityWh)
  
        }

        const currentPeriod = await demand.getCurrentPeriod()

        const notFulfilledWh = currentPeriod > demand.productionLastSetInPeriod ? demand.targetWhPerPeriod : demand.targetWhPerPeriod - demand.currentWhPerPeriod
        return Math.min(wh, notFulfilledWh, consumedWh);

    }


}