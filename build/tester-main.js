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
const test_accounts_1 = require("./test-accounts");
const Web3 = require('web3');
const getInstanceFromTruffleBuild = (truffleBuild, web3) => {
    const address = Object.keys(truffleBuild.networks).length > 0 ? truffleBuild.networks[Object.keys(truffleBuild.networks)[0]].address : null;
    return new web3.eth.Contract(truffleBuild.abi, address);
};
const main = () => __awaiter(this, void 0, void 0, function* () {
    const web3 = new Web3('http://localhost:8545');
    const assetAdminAccount = yield web3.eth.accounts.wallet.add(test_accounts_1.PrivateKeys[2]);
    const topAdminAccount = yield web3.eth.accounts.wallet.add(test_accounts_1.PrivateKeys[0]);
    const agreementAdminAccount = yield web3.eth.accounts.wallet.add("0xa05ddf7fe8302d117b516c0e401468a30c39a3e467ad3720381cf89500f0854b");
    const blockchainProperties = {
        web3: web3,
        producingAssetLogicInstance: yield getInstanceFromTruffleBuild(ewf_coo_1.AssetProducingLogicTruffleBuild, web3),
        consumingAssetLogicInstance: yield getInstanceFromTruffleBuild(ewf_coo_1.AssetConsumingLogicTruffleBuild, web3),
        certificateLogicInstance: yield getInstanceFromTruffleBuild(ewf_coo_1.CertificateLogicTruffleBuild, web3),
        demandLogicInstance: yield getInstanceFromTruffleBuild(ewf_coo_1.DemandLogicTruffleBuild, web3),
        assetAdminAccount: assetAdminAccount.address,
        topAdminAccount: topAdminAccount.address,
        agreementAdmin: agreementAdminAccount.address
    };
    const demandProps = {
        enabledProperties: [false, false, false, false, false, false, false, false, false, false],
        originator: "0x59e67AE7934C37d3376ab9c8dE153D10E07AE8C9",
        buyer: "0x59e67AE7934C37d3376ab9c8dE153D10E07AE8C9",
        startTime: 2123123131,
        endTime: 234234523454,
        timeframe: ewf_coo_1.TimeFrame.daily,
        pricePerCertifiedWh: 10,
        currency: ewf_coo_1.Currency.Ether,
        productingAsset: 0,
        consumingAsset: 0,
        locationCountry: "DE",
        locationRegion: "SAXONY",
        assettype: ewf_coo_1.AssetType.Solar,
        minCO2Offset: 1,
        otherGreenAttributes: "N.A",
        typeOfPublicSupport: "N.A",
        targetWhPerPeriod: 100000,
        registryCompliance: ewf_coo_1.Compliance.none,
        matcher: "0x343854a430653571b4de6bf2b8c475f828036c30"
    };
    console.log("Create demand");
    // const demand = await Demand.CREATE_DEMAND(demandProps, blockchainProperties)
    //console.log(demand)
    console.log("creation done");
    const assetProps = {
        // GeneralInformation
        smartMeter: '0x59e67AE7934C37d3376ab9c8dE153D10E07AE8C9',
        owner: topAdminAccount.address,
        assetType: ewf_coo_1.AssetType.BiomassGas,
        operationalSince: 0,
        capacityWh: 500,
        certificatesCreatedForWh: 0,
        active: true,
        complianceRegistry: ewf_coo_1.Compliance.EEC,
        otherGreenAttributes: 'none',
        typeOfPublicSupport: 'none',
        // Location
        country: 'DE',
        region: 'Saxony',
        zip: '1234',
        city: 'Springfield',
        street: 'No name street',
        houseNumber: '1',
        gpsLatitude: '0',
        gpsLongitude: '0'
    };
    const asset = yield ewf_coo_1.ProducingAsset.CREATE_ASSET(assetProps, blockchainProperties);
    console.log(asset.id);
    //console.log(await Certificate.GET_ALL_CERTIFICATES(blockchainProperties))
    //console.log((await Certificate.GET_ALL_CERTIFICATES_OWNED_BY('0x84A2C086Ffa013D06285cdD303556EC9bE5a1Ff7', blockchainProperties)).length)
    console.log(yield ewf_coo_1.Certificate.GET_ALL_CERTIFICATES_WITH_ESCROW('0x343854A430653571B4De6bF2b8C475F828036C30', blockchainProperties));
});
main();
//# sourceMappingURL=tester-main.js.map