import React, { useState, useEffect } from 'react'
import Head from 'next/head'

// import { BalancerSDK } from '@balancer-labs/sdk'
import { Button } from 'antd'
import Input from '@/components/Input'
import {
  useBalancerContract,
  useLayerContract,
  useContract,
} from '@/hooks/useContracts'
// import { useToken } from '@/hooks/useTokenInfo'
import useWeb3 from '@/hooks/useWeb3'
// import useApprove from '@/hooks/useApprove'
import noPayableAction, { noPayableErrorAction } from '@/utils/noPayableAction'
// import DemoPage from '@/modules/demo/DemoPage'

// https://docs.balancer.fi/reference/contracts/error-codes.html#lib
// https://app.balancer.fi/#/ethereum/pool/0x93d199263632a4ef4bb438f1feb99e57b4b5f0bd0000000000000000000005c2
// https://etherscan.io/tx/0xb06eb590fc7f422a60592937958a62539a7c6c85e76a480d9c81ea95eb983cb1

// https://app.balancer.fi/#/ethereum/pool/0x596192bb6e41802428ac943d2f1476c1af25cc0e000000000000000000000659
// https://etherscan.io/tx/0x2240c1a24bb657a42d9525e1b95a1cd1a99c63449dbb85591854ed3794fdd133

const pool_1 =
  '0x93d199263632a4ef4bb438f1feb99e57b4b5f0bd0000000000000000000005c2'
const pool_2 =
  '0x596192bb6e41802428ac943d2f1476c1af25cc0e000000000000000000000659'

const eth = '0x0000000000000000000000000000000000000000'
const WETH = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
const stETH = '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84'
const wstETH = '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0'
const ezETH = '0xbf5495Efe5DB9ce00f80364C8B423567e58d2110'

const BalancerMap = {
  [pool_1]: '0xdcdbf71A870cc60C6F9B621E28a7D3Ffd6Dd4965',
  [pool_2]: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
}

const approveToken = {
  [ezETH]: ezETH,
  [wstETH]: stETH,
}

// let balancer

export default function Demo() {
  const { _currentAccount, sendTransaction, isAllReady } = useWeb3()
  const getBalancerContract = useBalancerContract()
  const { contract: LayerContract, address: LayerAddress } = useLayerContract()
  const [amount, setAmount] = useState('0')

  const [poolPrice, setPoolPrice] = useState({
    [pool_1]: 0,
    [pool_2]: 0,
  })

  const { erc20Contract } = useContract()

  // const selectTokenInfo = useToken(outToken, address)

  // const amount = '1000000000000000000'

  // console.log('selectTokenInfo--', selectTokenInfo, address)

  // const { BtnWapper, needApprove } = useApprove({
  //   approveAmount: amount,
  //   allowance: selectTokenInfo.allowance,
  //   tokenContract: selectTokenInfo.contract,
  //   approveAddress: address,
  // })

  const updatePrice = async () => {
    try {
      const deadline = parseInt(new Date().getTime() / 1000, 10) + 1000

      const { contract: BalancerContract_1 } = getBalancerContract(
        BalancerMap[pool_1]
      )
      const apiCall_1 = await BalancerContract_1.methods.swap(
        [pool_1, 0, eth, wstETH, (1e18).toString(), '0x'],
        [_currentAccount, false, _currentAccount, false],
        '0',
        deadline
      )

      const price_1 =
        1e18 /
        (await apiCall_1.call({
          from: _currentAccount,
          value: (1e18).toString(),
        }))

      const { contract: BalancerContract_2 } = getBalancerContract(
        BalancerMap[pool_2]
      )
      const apiCall_2 = await BalancerContract_2.methods.swap(
        [pool_2, 0, eth, ezETH, (1e18).toString(), '0x'],
        [_currentAccount, false, _currentAccount, false],
        '0',
        deadline
      )

      const price_2 =
        1e18 /
        (await apiCall_2.call({
          from: _currentAccount,
          value: (1e18).toString(),
        }))

      setPoolPrice({
        [pool_1]: price_1.toString(),
        [pool_2]: price_2.toString(),
      })
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    if (isAllReady) updatePrice()
  }, [isAllReady])

  useEffect(() => {
    // balancer = new BalancerSDK({
    //   network: Number(config.chainInfo?.id),
    //   rpcUrl: config.chainInfo?.rpcUrl,
    // })

    const timer = setInterval(() => {
      updatePrice()
    }, 10000)

    return () => {
      clearInterval(timer)
    }
  }, [])

  console.log('amount---', amount)

  const setRelayerApproval = async (BalancerAddress) => {
    const hasApprovedRelayer = await LayerContract.methods
      .hasApprovedRelayer(_currentAccount, BalancerAddress)
      .call()
    if (!hasApprovedRelayer) {
      const apiCall = await LayerContract.methods.setRelayerApproval(
        _currentAccount,
        BalancerAddress,
        true
      )
      try {
        await noPayableAction(
          () =>
            sendTransaction({
              to: LayerAddress,
              data: apiCall.encodeABI(),
            }),
          {
            key: 'setRelayerApproval',
            action: 'setRelayerApproval',
          }
        )
      } catch (error) {
        console.log(error)
      }
    }
  }

  const swap = async ({ from, to, pool }) => {
    const BalancerAddress = BalancerMap[pool]

    const { contract: BalancerContract } = getBalancerContract(BalancerAddress)
    await setRelayerApproval(BalancerAddress)

    const isETH = from === eth

    const _amount = amount?.toString()

    if (!isETH) {
      const tokenContract = erc20Contract(approveToken[from])

      const res = await tokenContract.methods
        .allowance(_currentAccount, BalancerAddress)
        .call()

      const balance = await tokenContract.methods
        .balanceOf(_currentAccount)
        .call()

      if (balance < _amount) {
        alert(`balance: ${balance} not enough`)
      }

      if (res < _amount) {
        try {
          const apiCall = tokenContract.methods.approve(
            '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
            '115792089237316195423570985008687907853269984665640564039457584007913129639935'
          )
          await noPayableAction(
            () =>
              sendTransaction({
                to: tokenContract._address,
                data: apiCall.encodeABI(),
              }),
            {
              key: 'earn',
              action: 'approv',
            }
          )
        } catch (error) {
          noPayableErrorAction(`error_earn_approve`, error)
        }
      }
    }

    const deadline = parseInt(new Date().getTime() / 1000, 10) + 1000
    const apiCall = await BalancerContract.methods.swap(
      [pool, 0, from, to, _amount, '0x'],
      [_currentAccount, false, _currentAccount, false],
      '0',
      deadline
    )

    // const a = apiCall.encodeABI()
    // debugger

    await noPayableAction(
      () =>
        sendTransaction({
          to: BalancerAddress,
          value: isETH ? _amount : '0',
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
        <p>Swap stETH</p>
        <p>{pool_1}</p>
        {poolPrice[pool_1] ? <p>wstETH/WETH: {poolPrice[pool_1]}</p> : null}
        <Input hidePercent hideMax onChange={(v) => setAmount(v)} />
        <Button
          onClick={() =>
            swap({
              from: eth,
              to: wstETH,
              pool: pool_1,
            })
          }
        >
          Swap ETH to stETH
        </Button>
        <Button
          onClick={() =>
            swap({
              from: wstETH,
              to: WETH,
              pool: pool_1,
            })
          }
        >
          Swap stETH to WETH
        </Button>
      </div>

      <div className="w-[60%] mx-[auto] mt-[50px]">
        <p>Swap ezETH</p>
        <p>{pool_2}</p>
        {poolPrice[pool_2] ? <p>ezETH/WETH: {poolPrice[pool_2]}</p> : null}
        <Input hidePercent hideMax onChange={(v) => setAmount(v)} />
        <Button
          onClick={() =>
            swap({
              from: eth,
              to: ezETH,
              pool: pool_2,
            })
          }
        >
          Swap ETH to ezETH
        </Button>
        <Button
          onClick={() =>
            swap({
              from: ezETH,
              to: WETH,
              pool: pool_2,
            })
          }
        >
          Swap ezETH to WETH
        </Button>
      </div>
    </React.Fragment>
  )
}
