"use strict";
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const ewf_coo_1 = require("ewf-coo");
const Web3 = require('web3');
const getInstanceFromTruffleBuild = (truffleBuild, web3) => {
    const address = Object.keys(truffleBuild.networks).length > 0 ? truffleBuild.networks[Object.keys(truffleBuild.networks)[0]].address : null;
    return new web3.eth.Contract(truffleBuild.abi, address);
};
const main = () => __awaiter(this, void 0, void 0, function* () {
    const cooAddress = process.argv[2];
    const web3 = new Web3('http://localhost:8545');
    const wallet = yield web3.eth.accounts.wallet.add(process.argv[3]);
    console.log('* Smart meter address: ' + wallet.address);
    console.log('* CoO contract address: ' + cooAddress);
    const cooContractInstance = new web3.eth.Contract(ewf_coo_1.CoOTruffleBuild.abi, cooAddress);
    const assetProducingRegistryAddress = yield cooContractInstance.methods.assetProducingRegistry().call();
    const demandLogicAddress = yield cooContractInstance.methods.demandRegistry().call();
    const certificateLogicAddress = yield cooContractInstance.methods.certificateRegistry().call();
    const assetConsumingRegistryAddress = yield cooContractInstance.methods.assetConsumingRegistry().call();
    const userLogicAddress = yield cooContractInstance.methods.userRegistry().call();
    const blockchainProperties = {
        web3: web3,
        producingAssetLogicInstance: new web3.eth.Contract(ewf_coo_1.AssetProducingLogicTruffleBuild.abi, assetProducingRegistryAddress),
        demandLogicInstance: new web3.eth.Contract(ewf_coo_1.DemandLogicTruffleBuild.abi, demandLogicAddress),
        certificateLogicInstance: new web3.eth.Contract(ewf_coo_1.CertificateLogicTruffleBuild.abi, certificateLogicAddress),
        consumingAssetLogicInstance: new web3.eth.Contract(ewf_coo_1.AssetConsumingLogicTruffleBuild.abi, assetConsumingRegistryAddress),
        matcherAccount: wallet.address
    };
    const consumingAsset = yield (new ewf_coo_1.ConsumingAsset(parseInt(process.argv[4], 10), blockchainProperties)).syncWithBlockchain();
    let energy = 20000;
    if (new Date().getDate() == 8 || new Date().getDate() == 1 || new Date().getDate() == 10 || new Date().getDay() == 0 || new Date().getDay() == 6) {
        energy = 10000;
    }
    const gas = yield blockchainProperties.consumingAssetLogicInstance.methods
        .saveSmartMeterRead(consumingAsset.id, consumingAsset.lastSmartMeterReadWh + energy * 1000, blockchainProperties.web3.utils.fromUtf8('microsoft'), false)
        .estimateGas({ from: wallet.address });
    const tx = yield blockchainProperties.consumingAssetLogicInstance.methods
        .saveSmartMeterRead(consumingAsset.id, consumingAsset.lastSmartMeterReadWh + energy * 1000, blockchainProperties.web3.utils.fromUtf8('microsoft'), false)
        .send({ from: wallet.address, gas: Math.round(gas * 1.1), gasPrice: 0 });
});
main();
//# sourceMappingURL=profile-consumtion.js.map