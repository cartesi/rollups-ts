// Echo dapp run inside the Cartesi Machine by test/machine/run.sh. For each
// advance it emits a notice and a voucher echoing the payload plus a report;
// for each inspect it reports the query payload back.

import { Rollup } from "@cartesi/rollup";

const rollup = new Rollup();
await rollup.run({
    advance(request, rollup) {
        rollup.emitNotice(request.payload);
        rollup.emitVoucher({
            destination: request.msgSender,
            value: request.index,
            payload: request.payload,
        });
        rollup.emitReport(
            Buffer.from(
                `advance index=${request.index} chainId=${request.chainId}`,
            ),
        );
        return true;
    },
    inspect(request, rollup) {
        rollup.emitReport(request.payload);
        return true;
    },
});
