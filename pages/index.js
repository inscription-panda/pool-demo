import React, { useState } from 'react'
import Head from 'next/head'
import { Button } from 'antd'
import Input from '@/components/Input'
import { useBalancerContract, useLayerContract } from '@/hooks/useContracts'
import { useToken } from '@/hooks/useTokenInfo'
import useWeb3 from '@/hooks/useWeb3'
import useApprove from '@/hooks/useApprove'
import noPayableAction, { noPayableErrorAction } from '@/utils/noPayableAction'
// import DemoPage from '@/modules/demo/DemoPage'

// https://docs.balancer.fi/reference/contracts/error-codes.html#lib
// https://app.balancer.fi/#/ethereum/pool/0x93d199263632a4ef4bb438f1feb99e57b4b5f0bd0000000000000000000005c2

// https://etherscan.io/tx/0xb06eb590fc7f422a60592937958a62539a7c6c85e76a480d9c81ea95eb983cb1

export default function Demo() {
  const { _currentAccount, sendTransaction } = useWeb3()
  const { contract: BalancerContract, address } = useBalancerContract()
  const { contract: LayerContract, address: LayerAddress } = useLayerContract()
  const [amount, setAmount] = useState('0')

  const outToken = '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0'

  const selectTokenInfo = useToken(outToken, address)

  // const amount = '1000000000000000000'

  // console.log('selectTokenInfo--', selectTokenInfo, address)

  const { BtnWapper, needApprove } = useApprove({
    approveAmount: amount,
    allowance: selectTokenInfo.allowance,
    tokenContract: selectTokenInfo.contract,
    approveAddress: address,
  })

  console.log('amount---', amount)

  const setRelayerApproval = async () => {
    const hasApprovedRelayer = await LayerContract.methods
      .hasApprovedRelayer(_currentAccount, address)
      .call()
    if (!hasApprovedRelayer) {
      const apiCall = await LayerContract.methods.setRelayerApproval(
        _currentAccount,
        address,
        true
      )
      await noPayableAction(
        () =>
          sendTransaction({
            to: LayerAddress,
            data: apiCall.encodeABI(),
            value: amount,
          }),
        {
          key: 'setRelayerApproval',
          action: 'setRelayerApproval',
        }
      )
    }
  }

  // weth -> wstETH
  const swap = async () => {
    await setRelayerApproval()

    const deadline = parseInt(new Date().getTime() / 1000, 10) + 1000
    const apiCall = await BalancerContract.methods.swap(
      [
        '0x93d199263632a4ef4bb438f1feb99e57b4b5f0bd0000000000000000000005c2',
        0,
        '0x0000000000000000000000000000000000000000',
        outToken,
        amount,
        '0x',
      ],
      [_currentAccount, false, _currentAccount, false],
      '0',
      deadline
    )
    await noPayableAction(
      () =>
        sendTransaction({
          to: address,
          value: amount,
          data: apiCall.encodeABI(),
        }),
      {
        key: 'Swap',
        action: 'Swap',
      }
    )
  }

  return (
    <React.Fragment>
      <Head>
        <title>Swap</title>
      </Head>
      <div className="w-[60%] mx-[auto] mt-[50px]">
        <p>Swap ETH to stETH</p>
        <Input hidePercent hideMax onChange={(v) => setAmount(v?.toString())} />
        <BtnWapper onClick={swap} width="100%">
          Swap
        </BtnWapper>
      </div>
    </React.Fragment>
  )
}
