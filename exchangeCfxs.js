const { exchangeCFXs, account, cfxsContract, cfxsExchangeContract } = require('./conflux');
const { address } = require('js-conflux-sdk');
const axios = require('axios');
const { waitMilliseconds } = require('./utils.js');
const mappedAddress = address.cfxMappedEVMSpaceAddress(account.address);

async function main() {
    const ids = await getIDs(mappedAddress);
    for(let id of ids) {
        if (id === '0') continue;
        try {
            let cfxsId = parseInt(id);
            // check owner
            let info = await cfxsContract.CFXss(cfxsId);
            if(!info || info.length === 0 || info[1] != mappedAddress) {
                console.log(`Id ${cfxsId} is not yours`);
                await waitMilliseconds(100);
                continue;
            }
            let minted = await cfxsExchangeContract.minted(cfxsId);
            if (minted) {
                console.log(`Id ${cfxsId} already exchanged`);
                await waitMilliseconds(100);
                continue;
            }

            console.log(`Exchange cfxs id ${cfxsId}`);
            const receipt = await exchangeCFXs([cfxsId]);
            console.log(`Result: ${receipt.outcomeStatus === 0 ? 'success' : 'fail'}`);
        } catch(e) {
            console.log('Transfer Error', e);
            await waitMilliseconds(500);
        }
    }
}

main().catch(e => console.error(e));

async function getIDs(_addr) {
    /* 
    // from pana's service
    let res = await axios.get(`http://110.41.179.168:8088?address=${_addr}`);
    const ids = res.data;
    return ids; */
    // from 36u's service
    let ids = [];
    const limit = 1000;
    let startIndex = 0;
    while(true) {
        let { count, rows } = await axios.get(`http://test.conins.io/?owner=${address}&startIndex=${startIndex}&size=${limit}`);
        ids = ids.concat(rows.map(item => item.id));
        if (rows.length < limit) {
            break;
        }
        startIndex += limit;
    }
    return ids;
}