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

    const profile = [
        {date: 13, value: 816940},
        {date: 14, value: 785620},
        {date: 15, value: 443630},
        {date: 16, value: 859970},
        {date: 17, value: 548590},
        {date: 18, value: 477330},
        {date: 19, value: 527470},
        {date: 20, value: 512740},
        {date: 22, value: 827760},
        {date: 22, value: 617930},
        {date: 23, value: 559880},
        {date: 24, value: 599710},
        {date: 25, value: 726510},
        {date: 26, value: 377900},
        {date: 27, value: 440160},
        {date: 28, value: 748020},
        {date: 29, value: 301110},
        {date: 30, value: 746580},
        {date: 31, value: 442510},
        {date: 2, value: 392760},
        {date: 3, value: 428670},
        {date: 4, value: 340220},
        {date: 5, value: 239580},
        {date: 6, value: 275440}
    ]

    
    profile.forEach(async entry => {
        if (new Date().getDate() == entry.date) {
            const energy = entry.value
            const gas = await blockchainProperties.consumingAssetLogicInstance.methods
                .saveSmartMeterRead(consumingAsset.id, consumingAsset.lastSmartMeterReadWh + energy, blockchainProperties.web3.utils.fromUtf8('microsoft'), false)
                .estimateGas({ from: wallet.address })
    
            const tx = await blockchainProperties.consumingAssetLogicInstance.methods
                .saveSmartMeterRead(consumingAsset.id, consumingAsset.lastSmartMeterReadWh + energy, blockchainProperties.web3.utils.fromUtf8('microsoft'), false)
                .send({ from: wallet.address, gas: Math.round(gas * 1.1), gasPrice: 0 })
        }
    })


}

main()




