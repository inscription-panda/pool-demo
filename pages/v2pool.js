import React, { useState, useEffect } from 'react'
import Head from 'next/head'

// import { BalancerSDK } from '@balancer-labs/sdk'
import { Button } from 'antd'
import Input from '@/components/Input'
import {
  useV2PoolContract,
  useLayerContract,
  useContract,
} from '@/hooks/useContracts'
// import { useToken } from '@/hooks/useTokenInfo'
import useWeb3 from '@/hooks/useWeb3'
// import useApprove from '@/hooks/useApprove'
import noPayableAction, { noPayableErrorAction } from '@/utils/noPayableAction'
// import DemoPage from '@/modules/demo/DemoPage'

const pool = '0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc'

const eth = '0x0000000000000000000000000000000000000000'
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const WETH = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'

// let balancer

export default function Demo() {
  const { _currentAccount, sendTransaction, isAllReady } = useWeb3()
  const getV2PoolContract = useV2PoolContract()
  const [amount, setAmount] = useState('0')

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
    } catch (error) {}
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

  const approve = async () => {
    const { contract: V2PoolContract } = getV2PoolContract(pool)

    try {
      const apiCall = V2PoolContract.methods.approve(
        '0x7a250d5630b4cf539739df2c5dacb4c659f2488d',
        '115792089237316195423570985008687907853269984665640564039457584007913129639935'
      )
      await noPayableAction(
        () =>
          sendTransaction({
            to: V2PoolContract._address,
            data: apiCall.encodeABI(),
          }),
        {
          key: 'approv',
          action: 'approv',
        }
      )
    } catch (error) {
      noPayableErrorAction(`error_approve`, error)
    }
  }

  const swap = async ({ from }) => {
    const { contract: V2PoolContract } = getV2PoolContract(pool)

    const isETH = from === eth

    const _amount = (amount / 1e12)?.toString()

    console.log('_amount---', _amount)

    const approveAddress = pool

    await approve()

    if (!isETH) {
      const tokenContract = erc20Contract(from)

      const res = await tokenContract.methods
        .allowance(_currentAccount, approveAddress)
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
            approveAddress,
            '115792089237316195423570985008687907853269984665640564039457584007913129639935'
          )
          await noPayableAction(
            () =>
              sendTransaction({
                to: tokenContract._address,
                data: apiCall.encodeABI(),
              }),
            {
              key: 'approv',
              action: 'approv',
            }
          )
        } catch (error) {
          noPayableErrorAction(`error_approve`, error)
        }
      }
    }

    const apiCall = await V2PoolContract.methods.swap(
      _amount, // 花掉的 usdc
      '0', // 花掉的 weth
      _currentAccount,
      []
    )

    const data = apiCall.encodeABI()
    debugger

    await noPayableAction(
      () =>
        sendTransaction({
          to: pool,
          value: _amount,
          data,
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
        <p>{pool}</p>

        <Input hidePercent hideMax onChange={(v) => setAmount(v)} />
        <Button
          onClick={() =>
            swap({
              from: WETH,
            })
          }
        >
          Swap WETH to USDC
        </Button>
        <Button
          onClick={() =>
            swap({
              from: USDC,
            })
          }
        >
          Swap USDC to WETH
        </Button>
      </div>
    </React.Fragment>
  )
}
