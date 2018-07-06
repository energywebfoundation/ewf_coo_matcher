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


const Web3 = require('web3')


const getInstanceFromTruffleBuild = (truffleBuild: any, web3: Web3Type) => {
    const address = Object.keys(truffleBuild.networks).length > 0 ? truffleBuild.networks[Object.keys(truffleBuild.networks)[0]].address : null
    return new web3.eth.Contract(truffleBuild.abi, address)
}



const main = async () => {
    const cooAddress = process.argv[2]

    const web3 = new Web3('http://localhost:8545')
    const wallet = await web3.eth.accounts.wallet.add(process.argv[3])

    console.log('* Smart meter address: ' + wallet.address)
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

    const consumingAsset = await (new ConsumingAsset(parseInt(process.argv[4], 10), blockchainProperties)).syncWithBlockchain()


    let energy = 20000
    if (new Date().getDate() == 8 || new Date().getDate() == 1 || new Date().getDate() == 10 || new Date().getDay() == 0 || new Date().getDay() == 6) {
        energy = 10000
    }
    const gas = await blockchainProperties.consumingAssetLogicInstance.methods
        .saveSmartMeterRead(consumingAsset.id, consumingAsset.lastSmartMeterReadWh + energy * 1000, blockchainProperties.web3.utils.fromUtf8('microsoft'), false)
        .estimateGas({ from: wallet.address })

    const tx = await blockchainProperties.consumingAssetLogicInstance.methods
        .saveSmartMeterRead(consumingAsset.id, consumingAsset.lastSmartMeterReadWh + energy * 1000, blockchainProperties.web3.utils.fromUtf8('microsoft'), false)
        .send({ from: wallet.address, gas: Math.round(gas * 1.1), gasPrice: 0 })




}

main()




