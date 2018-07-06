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
const MatchingManager_1 = require("./MatchingManager");
const SimpleMatcher_1 = require("./SimpleMatcher");
const Web3 = require('web3');
const getInstanceFromTruffleBuild = (truffleBuild, web3) => {
    const address = Object.keys(truffleBuild.networks).length > 0 ? truffleBuild.networks[Object.keys(truffleBuild.networks)[0]].address : null;
    return new web3.eth.Contract(truffleBuild.abi, address);
};
const initEventHandling = (matchingManager, blockchainProperties, matcherAddress) => __awaiter(this, void 0, void 0, function* () {
    const currentBlockNumber = yield blockchainProperties.web3.eth.getBlockNumber();
    const certificateContractEventHandler = new ewf_coo_1.ContractEventHandler(blockchainProperties.certificateLogicInstance, currentBlockNumber);
    certificateContractEventHandler.onEvent('LogCreatedCertificate', (event) => __awaiter(this, void 0, void 0, function* () {
        if (matcherAddress === event.returnValues.escrow) {
            console.log('\n* Event: LogCreatedCertificate certificate hold in trust id: ' + event.returnValues._certificateId);
            const newCertificate = yield new ewf_coo_1.Certificate(event.returnValues._certificateId, blockchainProperties).syncWithBlockchain();
            matchingManager.registerCertificate(newCertificate);
        }
    }));
    certificateContractEventHandler.onEvent('LogCertificateOwnerChanged', (event) => __awaiter(this, void 0, void 0, function* () {
        if (matcherAddress === event.returnValues._oldEscrow && matcherAddress !== event.returnValues._newEscrow) {
            console.log('\n* Event: LogCertificateOwnerChanged certificate escrow changed certificate id: ' + event.returnValues._certificateId);
            matchingManager.removeCertificate(parseInt(event.returnValues._certificateId, 10));
        }
    }));
    const demandContractEventHandler = new ewf_coo_1.ContractEventHandler(blockchainProperties.demandLogicInstance, currentBlockNumber);
    demandContractEventHandler.onEvent('LogDemandFullyCreated', (event) => __awaiter(this, void 0, void 0, function* () {
        console.log('\n* Event: LogDemandFullyCreated demand: ' + event.returnValues._demandId);
        const newDemand = yield new ewf_coo_1.Demand(event.returnValues._demandId, blockchainProperties).syncWithBlockchain();
        yield matchingManager.registerDemand(newDemand);
        matchingManager.matchDemandWithCertificatesHoldInTrust(newDemand);
    }));
    demandContractEventHandler.onEvent('LogDemandExpired', (event) => __awaiter(this, void 0, void 0, function* () {
        console.log('\n* Event: LogDemandExpired demand: ' + event.returnValues._demandId);
        matchingManager.removeDemand(parseInt(event.returnValues._demandId, 10));
    }));
    const assetContractEventHandler = new ewf_coo_1.ContractEventHandler(blockchainProperties.producingAssetLogicInstance, currentBlockNumber);
    assetContractEventHandler.onEvent('LogNewMeterRead', (event) => matchingManager.match(event.returnValues._assetId, parseInt(event.returnValues._newMeterRead, 10) - parseInt(event.returnValues._oldMeterRead, 10)));
    assetContractEventHandler.onEvent('LogAssetFullyInitialized', (event) => __awaiter(this, void 0, void 0, function* () {
        console.log('\n* Event: LogAssetFullyInitialized asset: ' + event.returnValues._assetId);
        const newAsset = yield new ewf_coo_1.ProducingAsset(event.returnValues._assetId, blockchainProperties).syncWithBlockchain();
        matchingManager.registerProducingAsset(newAsset);
    }));
    assetContractEventHandler.onEvent('LogAssetSetActive', (event) => __awaiter(this, void 0, void 0, function* () {
        console.log('\n* Event: LogAssetSetActive  asset: ' + event.returnValues._assetId);
        const asset = yield (new ewf_coo_1.ProducingAsset(event.returnValues._assetId, blockchainProperties)).syncWithBlockchain();
        matchingManager.registerProducingAsset(asset);
    }));
    assetContractEventHandler.onEvent('LogAssetSetInactive', (event) => __awaiter(this, void 0, void 0, function* () {
        console.log('\n* Event: LogAssetSetInactive asset: ' + event.returnValues._assetId);
        matchingManager.removeProducingAsset(parseInt(event.returnValues._assetId, 10));
    }));
    const consumingAssetContractEventHandler = new ewf_coo_1.ContractEventHandler(blockchainProperties.consumingAssetLogicInstance, currentBlockNumber);
    consumingAssetContractEventHandler.onEvent('LogNewMeterRead', (event) => __awaiter(this, void 0, void 0, function* () {
        console.log('\n* Event: LogNewMeterRead consuming asset: ' + event.returnValues._assetId);
        const asset = yield matchingManager.createOrRefreshConsumingAsset(event.returnValues._assetId);
        console.log('*> Meter read: ' + asset.lastSmartMeterReadWh + ' Wh');
    }));
    consumingAssetContractEventHandler.onEvent('LogAssetFullyInitialized', (event) => __awaiter(this, void 0, void 0, function* () {
        console.log('\n* Event: LogAssetFullyInitialized consuming asset: ' + event.returnValues._assetId);
        const newAsset = yield new ewf_coo_1.ConsumingAsset(event.returnValues._assetId, blockchainProperties).syncWithBlockchain();
        matchingManager.registerConsumingAsset(newAsset);
    }));
    consumingAssetContractEventHandler.onEvent('LogAssetSetActive', (event) => __awaiter(this, void 0, void 0, function* () {
        console.log('\n* Event: LogAssetSetActive consuming asset: ' + event.returnValues._assetId);
        const asset = yield (new ewf_coo_1.ConsumingAsset(event.returnValues._assetId, blockchainProperties)).syncWithBlockchain();
        matchingManager.registerConsumingAsset(asset);
    }));
    consumingAssetContractEventHandler.onEvent('LogAssetSetInactive', (event) => __awaiter(this, void 0, void 0, function* () {
        console.log('\n* Event: LogAssetSetInactive consuming asset: ' + event.returnValues._assetId);
        matchingManager.removeConsumingAsset(parseInt(event.returnValues._assetId, 10));
    }));
    const eventHandlerManager = new ewf_coo_1.EventHandlerManager(4000, blockchainProperties);
    eventHandlerManager.registerEventHandler(consumingAssetContractEventHandler);
    eventHandlerManager.registerEventHandler(demandContractEventHandler);
    eventHandlerManager.registerEventHandler(assetContractEventHandler);
    eventHandlerManager.registerEventHandler(certificateContractEventHandler);
    eventHandlerManager.start();
});
const initMatchingManager = (blockchainProperties, escrowAddress) => __awaiter(this, void 0, void 0, function* () {
    const matchingManager = new MatchingManager_1.MatchingManager(blockchainProperties);
    matchingManager.setMatcher(new SimpleMatcher_1.SimpleMatcher(blockchainProperties, matchingManager));
    console.log('\n* Getting all porducing assets');
    const assetList = (yield ewf_coo_1.ProducingAsset.GET_ALL_ASSETS(blockchainProperties));
    assetList.forEach((asset) => __awaiter(this, void 0, void 0, function* () { return matchingManager.registerProducingAsset(asset); }));
    console.log('\n* Getting all consuming assets');
    const consumingAssetList = (yield ewf_coo_1.ConsumingAsset.GET_ALL_ASSETS(blockchainProperties));
    consumingAssetList.forEach((asset) => __awaiter(this, void 0, void 0, function* () { return matchingManager.registerConsumingAsset(asset); }));
    console.log('\n* Getting all active demands');
    const demandList = yield ewf_coo_1.Demand.GET_ALL_ACTIVE_DEMANDS(blockchainProperties);
    demandList.forEach((demand) => __awaiter(this, void 0, void 0, function* () { return matchingManager.registerDemand(demand); }));
    console.log('\n* Getting all certificates hold in trust');
    const certificateList = yield ewf_coo_1.Certificate.GET_ALL_CERTIFICATES_WITH_ESCROW(escrowAddress, blockchainProperties);
    certificateList.forEach((certificate) => __awaiter(this, void 0, void 0, function* () { return matchingManager.registerCertificate(certificate); }));
    return matchingManager;
});
const main = () => __awaiter(this, void 0, void 0, function* () {
    const cooAddress = process.argv[2];
    const privateKeyMatcher = process.argv[3];
    const web3 = new Web3('http://localhost:8545');
    const wallet = yield web3.eth.accounts.wallet.add(privateKeyMatcher);
    console.log('* Machter address: ' + wallet.address);
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
    const matchingManager = yield initMatchingManager(blockchainProperties, wallet.address);
    yield initEventHandling(matchingManager, blockchainProperties, wallet.address);
});
main();
//# sourceMappingURL=matcher-main.js.map