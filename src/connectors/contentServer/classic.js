'use strict';

const URI = require('urijs');
const P = require('bluebird');
const errors = require('../../errors');

const config = require('../../config');
const request = require('../http');

exports.getResolutions = async function (id, includePlay = false) {
    let resolutions = await getResolutions(id);

    if (resolutions === null) {
        return [];
    }

    if (includePlay) {
        resolutions = P.map(resolutions, async resolution => {
            const { play } = await getResolutionDetails(id, resolution.resolution_type);

            if (play === undefined) {
                throw errors.classicNotProvidingPlays(id);
            }

            resolution.play = play;
            return resolution;
        });
    }

    return resolutions;
};

function contentServerRequest (uri) {
    return request({
        uri,
        method: 'GET',
        json: true,
        rejectUnauthorized: !config.contentServer.insecure,
        headers: {
            Authorization: config.contentServer.auth
        }
    }, true);
}

function getResolutions (id) {
    const uri = new URI(config.contentServer.host);
    uri.path('/r/insights/v3/rules/');
    uri.segment(id);
    uri.segment('ansible-resolutions');
    uri.segment('105');

    return contentServerRequest(uri.toString());
}

function getResolutionDetails (id, resolution) {
    const uri = new URI(config.contentServer.host);
    uri.path('/r/insights/v3/rules/');
    uri.segment(id);
    uri.segment('ansible-resolutions');
    uri.segment('105');
    uri.segment(resolution);

    return contentServerRequest(uri.toString());
}

exports.ping = function () {
    return exports.getResolutions('network_bond_opts_config_issue|NETWORK_BONDING_OPTS_DOUBLE_QUOTES_ISSUE');
};
