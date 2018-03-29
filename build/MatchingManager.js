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
class MatchingManager {
    constructor(blockchainProperties) {
        this.producingAssets = [];
        this.consumingAssets = [];
        this.demands = [];
        this.certificatesHoldInTrust = [];
        this.blockchainProperties = blockchainProperties;
    }
    setMatcher(matcher) {
        this.matcher = matcher;
    }
    match(assetId, wh) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('\nTry to match ' + wh + ' Wh from asset ' + assetId);
            console.log('- Number of certificates hold in trust: ' + this.certificatesHoldInTrust.length);
            const asset = this.producingAssets.find((asset) => asset.id == assetId);
            if (asset) {
                this.matcher.match(wh, asset, this.demands);
            }
            else {
                //TODO: get asset
            }
        });
    }
    matchDemandWithCertificatesHoldInTrust(demand) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('\nTry to fit demand ' + demand.id + ' with certificates hold in trust');
            console.log('- Number of certificates hold in trust: ' + this.certificatesHoldInTrust.length);
            this.matcher.matchDemandWithCertificatesHoldInTrust(demand, this.certificatesHoldInTrust);
        });
    }
    registerProducingAsset(newAsset) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingAsset = this.producingAssets.find((asset) => newAsset.id === asset.id);
            if (existingAsset) {
                yield existingAsset.syncWithBlockchain();
            }
            else {
                this.producingAssets.push(newAsset);
                console.log('*> registered producing asset: ' + newAsset.id);
            }
        });
    }
    registerConsumingAsset(newAsset) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingAsset = this.consumingAssets.find((asset) => newAsset.id === asset.id);
            if (existingAsset) {
                yield existingAsset.syncWithBlockchain();
            }
            else {
                this.consumingAssets.push(newAsset);
                console.log('*> registered consuming asset: ' + newAsset.id);
            }
        });
    }
    registerDemand(newDemand) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingDemand = this.demands.find((demand) => newDemand.id === demand.id);
            if (existingDemand) {
                yield existingDemand.syncWithBlockchain();
            }
            else {
                this.demands.push(newDemand);
                console.log('*> registered demand: ' + newDemand.id);
            }
        });
    }
    registerCertificate(newCertificate) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingCertificate = this.certificatesHoldInTrust.find((certificate) => newCertificate.id === certificate.id);
            if (existingCertificate) {
                yield existingCertificate.syncWithBlockchain();
            }
            else {
                this.certificatesHoldInTrust.push(newCertificate);
                console.log('*> registered certificate hold in trust: ' + newCertificate.id);
            }
        });
    }
    removeProducingAsset(assetId) {
        return __awaiter(this, void 0, void 0, function* () {
            const assetIndex = this.producingAssets.findIndex((asset) => assetId === asset.id);
            if (assetIndex !== -1) {
                this.producingAssets.splice(assetIndex, 1);
                console.log('*> removed producing asset: ' + assetId);
            }
        });
    }
    removeConsumingAsset(assetId) {
        return __awaiter(this, void 0, void 0, function* () {
            const assetIndex = this.consumingAssets.findIndex((asset) => assetId === asset.id);
            if (assetIndex !== -1) {
                this.consumingAssets.splice(assetIndex, 1);
                console.log('*> removed consuming asset: ' + assetId);
            }
        });
    }
    removeDemand(demandId) {
        return __awaiter(this, void 0, void 0, function* () {
            const demandIndex = this.demands.findIndex((demand) => demandId === demand.id);
            if (demandIndex !== -1) {
                this.demands.splice(demandIndex, 1);
                console.log('*> removed demand: ' + demandId);
            }
        });
    }
    removeCertificate(certificateId) {
        return __awaiter(this, void 0, void 0, function* () {
            const certificateIndex = this.certificatesHoldInTrust.findIndex((certificate) => certificateId === certificate.id);
            if (certificateId !== -1) {
                this.certificatesHoldInTrust.splice(certificateIndex, 1);
                console.log('*> removed certificate hold in trus: ' + certificateId);
            }
        });
    }
    getProducingAsset(assetId) {
        return __awaiter(this, void 0, void 0, function* () {
            let asset = this.producingAssets.find((asset) => asset.id === assetId);
            if (!asset) {
                asset = yield (new ewf_coo_1.ProducingAsset(assetId, this.blockchainProperties)).syncWithBlockchain();
            }
            return asset;
        });
    }
    getConsumingAsset(assetId) {
        return __awaiter(this, void 0, void 0, function* () {
            let asset = this.consumingAssets.find((asset) => asset.id === assetId);
            if (!asset) {
                asset = yield (new ewf_coo_1.ConsumingAsset(assetId, this.blockchainProperties)).syncWithBlockchain();
            }
            return asset;
        });
    }
    createOrRefreshConsumingAsset(assetId) {
        return __awaiter(this, void 0, void 0, function* () {
            let assetIndex = this.consumingAssets.findIndex((asset) => asset.id === assetId);
            if (assetIndex !== -1) {
                this.consumingAssets[assetId] = yield this.consumingAssets[assetId].syncWithBlockchain();
                return this.consumingAssets[assetId];
            }
            else {
                let asset = yield (new ewf_coo_1.ConsumingAsset(assetId, this.blockchainProperties).syncWithBlockchain());
                this.consumingAssets.push(asset);
                return asset;
            }
        });
    }
    getDemand(demandId) {
        return this.demands.find((demand) => demand.id === demandId);
    }
}
exports.MatchingManager = MatchingManager;
//# sourceMappingURL=MatchingManager.js.map