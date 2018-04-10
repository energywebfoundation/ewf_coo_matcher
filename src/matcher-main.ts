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

import Web3Type from './types/web3'
import { Demand, CoOTruffleBuild, DemandLogicTruffleBuild, AssetProducingLogicTruffleBuild, AssetConsumingLogicTruffleBuild, CertificateLogicTruffleBuild, ContractEventHandler, Asset, EventHandlerManager, BlockchainProperties, Certificate, ProducingAsset, ConsumingAsset } from 'ewf-coo'
import { MatchingManager } from './MatchingManager'
import { SimpleMatcher } from './SimpleMatcher'
import { PrivateKeys } from './test-accounts'

const Web3 = require('web3')


const getInstanceFromTruffleBuild = (truffleBuild: any, web3: Web3Type) => {
    const address = Object.keys(truffleBuild.networks).length > 0 ? truffleBuild.networks[Object.keys(truffleBuild.networks)[0]].address : null
    return new web3.eth.Contract(truffleBuild.abi, address)
}



const initEventHandling = async (matchingManager: MatchingManager, blockchainProperties: BlockchainProperties, matcherAddress: string) => {
    const currentBlockNumber = await blockchainProperties.web3.eth.getBlockNumber()

    const certificateContractEventHandler = new ContractEventHandler(blockchainProperties.certificateLogicInstance, currentBlockNumber)
    certificateContractEventHandler.onEvent('LogCreatedCertificate' , async (event) => {
        
        if (matcherAddress === event.returnValues.escrow) {
            console.log('\n* Event: LogCreatedCertificate certificate hold in trust id: ' + event.returnValues._certificateId)
            const newCertificate = await new Certificate(event.returnValues._certificateId, blockchainProperties).syncWithBlockchain()
            matchingManager.registerCertificate(newCertificate)   
        }
       
    })

    certificateContractEventHandler.onEvent('LogCertificateOwnerChanged' , async (event) => {
        
        if (matcherAddress === event.returnValues._oldEscrow && matcherAddress !== event.returnValues._newEscrow) {
            console.log('\n* Event: LogCertificateOwnerChanged certificate escrow changed certificate id: ' + event.returnValues._certificateId)
            
            matchingManager.removeCertificate(parseInt(event.returnValues._certificateId, 10))
        }
       
    })

    const demandContractEventHandler = new ContractEventHandler(blockchainProperties.demandLogicInstance, currentBlockNumber)

    demandContractEventHandler.onEvent('LogDemandFullyCreated', async (event) => {
        console.log('\n* Event: LogDemandFullyCreated demand: ' + event.returnValues._demandId)
        const newDemand = await new Demand(event.returnValues._demandId, blockchainProperties).syncWithBlockchain()
        await matchingManager.registerDemand(newDemand)
        matchingManager.matchDemandWithCertificatesHoldInTrust(newDemand)

    })

    demandContractEventHandler.onEvent('LogDemandExpired', async (event) => {
        console.log('\n* Event: LogDemandExpired demand: ' + event.returnValues._demandId)
        matchingManager.removeDemand(parseInt(event.returnValues._demandId,10))

    })

    const assetContractEventHandler = new ContractEventHandler(blockchainProperties.producingAssetLogicInstance, currentBlockNumber)

    assetContractEventHandler.onEvent('LogNewMeterRead', (event) => 
        matchingManager.match(event.returnValues._assetId, event.returnValues._newMeterRead - event.returnValues._oldMeterRead))

    assetContractEventHandler.onEvent('LogAssetFullyInitialized', async (event) => {
        console.log('\n* Event: LogAssetFullyInitialized asset: ' + event.returnValues._assetId)
        const newAsset = await new ProducingAsset(event.returnValues._assetId, blockchainProperties).syncWithBlockchain()
        matchingManager.registerProducingAsset(newAsset)

    })

    assetContractEventHandler.onEvent('LogAssetSetActive' , async (event) => {
        console.log('\n* Event: LogAssetSetActive  asset: ' + event.returnValues._assetId)
   
        const asset = await (new ProducingAsset(event.returnValues._assetId, blockchainProperties)).syncWithBlockchain()
        matchingManager.registerProducingAsset(asset)

    })

    assetContractEventHandler.onEvent('LogAssetSetInactive' , async (event) => {
        console.log('\n* Event: LogAssetSetInactive asset: ' + event.returnValues._assetId)

        matchingManager.removeProducingAsset(parseInt(event.returnValues._assetId,10))
        
    })

    const consumingAssetContractEventHandler = new ContractEventHandler(blockchainProperties.consumingAssetLogicInstance, currentBlockNumber)

    consumingAssetContractEventHandler.onEvent('LogNewMeterRead', async (event) => {
        console.log('\n* Event: LogNewMeterRead consuming asset: ' + event.returnValues._assetId);
        const asset = await matchingManager.createOrRefreshConsumingAsset(event.returnValues._assetId)
        console.log('*> Meter read: '  + asset.lastSmartMeterReadWh + ' Wh')

    })

    consumingAssetContractEventHandler.onEvent('LogAssetFullyInitialized', async (event) => {
        console.log('\n* Event: LogAssetFullyInitialized consuming asset: ' + event.returnValues._assetId)
        const newAsset = await new ConsumingAsset(event.returnValues._assetId , blockchainProperties).syncWithBlockchain()
        matchingManager.registerConsumingAsset(newAsset)

    })

    consumingAssetContractEventHandler.onEvent('LogAssetSetActive' , async (event) => {
        console.log('\n* Event: LogAssetSetActive consuming asset: ' + event.returnValues._assetId)
   
        const asset = await (new ConsumingAsset(event.returnValues._assetId, blockchainProperties)).syncWithBlockchain()
        matchingManager.registerConsumingAsset(asset)

    })

    consumingAssetContractEventHandler.onEvent('LogAssetSetInactive' , async (event) => {
        console.log('\n* Event: LogAssetSetInactive consuming asset: ' + event.returnValues._assetId)

        matchingManager.removeConsumingAsset(parseInt(event.returnValues._assetId, 10))
        
    })
    
    const eventHandlerManager = new EventHandlerManager(4000, blockchainProperties)
    eventHandlerManager.registerEventHandler(consumingAssetContractEventHandler)
    eventHandlerManager.registerEventHandler(demandContractEventHandler)
    eventHandlerManager.registerEventHandler(assetContractEventHandler)
    eventHandlerManager.registerEventHandler(certificateContractEventHandler)
    eventHandlerManager.start()
}

const initMatchingManager = async (blockchainProperties: BlockchainProperties, escrowAddress: string) => {
    const matchingManager = new MatchingManager(blockchainProperties)
    matchingManager.setMatcher(new SimpleMatcher(blockchainProperties, matchingManager))
    
    console.log('\n* Getting all porducing assets')
    const assetList = (await ProducingAsset.GET_ALL_ASSETS(blockchainProperties))
    assetList.forEach(async (asset: Asset) => matchingManager.registerProducingAsset(asset as ProducingAsset))

    console.log('\n* Getting all consuming assets')
    const consumingAssetList = (await ConsumingAsset.GET_ALL_ASSETS(blockchainProperties))
    consumingAssetList.forEach(async (asset: Asset) => matchingManager.registerConsumingAsset(asset as ConsumingAsset))
    
    console.log('\n* Getting all active demands')
    const demandList = await Demand.GET_ALL_ACTIVE_DEMANDS(blockchainProperties)
    demandList.forEach(async (demand: Demand) => matchingManager.registerDemand(demand))

    console.log('\n* Getting all certificates hold in trust')
    const certificateList = await Certificate.GET_ALL_CERTIFICATES_WITH_ESCROW(escrowAddress, blockchainProperties)
    certificateList.forEach(async (certificate: Certificate) => matchingManager.registerCertificate(certificate))
    
    return matchingManager
}

const main = async () => {
    const cooAddress = process.argv[2]

    const web3 = new Web3('http://localhost:8545')
    const wallet = await web3.eth.accounts.wallet.add(PrivateKeys[8])
    
    console.log('* Machter address: ' + wallet.address)
    console.log('* CoO contract address: ' + cooAddress)


 


    const cooContractInstance = new web3.eth.Contract((CoOTruffleBuild as any).abi, cooAddress)
    const assetProducingRegistryAddress = await cooContractInstance.methods.assetProducingRegistry().call()
    const demandLogicAddress = await cooContractInstance.methods.demandRegistry().call()
    const certificateLogicAddress = await cooContractInstance.methods.certificateRegistry().call()
    const assetConsumingRegistryAddress = await cooContractInstance.methods.assetConsumingRegistry().call()
    const userLogicAddress = await cooContractInstance.methods.userRegistry().call()

    const blockchainProperties: BlockchainProperties = {
        web3: web3,
        producingAssetLogicInstance: new web3.eth.Contract((AssetProducingLogicTruffleBuild as any).abi, assetProducingRegistryAddress),
        demandLogicInstance: new web3.eth.Contract((DemandLogicTruffleBuild as any).abi, demandLogicAddress),
        certificateLogicInstance: new web3.eth.Contract((CertificateLogicTruffleBuild as any).abi, certificateLogicAddress),
        consumingAssetLogicInstance: new web3.eth.Contract((AssetConsumingLogicTruffleBuild as any).abi, assetConsumingRegistryAddress),
        matcherAccount: wallet.address
    }

    const matchingManager = await initMatchingManager(blockchainProperties, wallet.address)

    await initEventHandling(matchingManager, blockchainProperties, wallet.address)

}

main()




