import { useEffect, useState, useCallback } from 'react'
import useWeb3 from '@/hooks/useWeb3'
import { useMutiCallV2 } from '@/hooks/useMutiCalls'
import { useContract } from '@/hooks/useContracts'
import config from '@/config/index'

const useTokens = (options) => {
  const { _currentAccount, web3, blockNumber, isAllReady } = useWeb3()
  const [tokenContracts, setTokenContracts] = useState([])
  const [tokenBalance, setTokenBalance] = useState([])
  const [tokenInfo, setTokenInfo] = useState([])
  const multiCallsV2 = useMutiCallV2()
  const { erc20Contract } = useContract()

  const fetchUserInfo = useCallback(async () => {
    try {
      const ethBalance = await web3.eth.getBalance(_currentAccount)
      const noZeroTokens = (options || []).filter(
        (i) => i.address !== config.zeroAddress
      )
      const _tokenContracts = noZeroTokens.map((i) => erc20Contract(i.address))

      const calls = _tokenContracts
        .map(({ methods }, index) => {
          if (noZeroTokens[index]?.approveTo) {
            return [
              methods.balanceOf(_currentAccount),
              methods.allowance(
                _currentAccount,
                noZeroTokens[index]?.approveTo
              ),
            ]
          }
          return [methods.balanceOf(_currentAccount)]
        })
        .reverse()
        .reduce((prev, cur) => cur.concat(prev), [])

      const res = await multiCallsV2(calls)

      const list = noZeroTokens.map((i, index) => {
        if (i.approveTo) {
          return {
            symbol: i.symbol,
            contract: _tokenContracts[index],
            balance: res[index * 2],
            allowance: res[index * 2 + 1],
            source: i,
          }
        }

        return {
          contract: _tokenContracts[index],
          symbol: i.symbol,
          balance: res[index],
          source: i,
        }
      })

      const ethIndex = options.findIndex(
        (i) => i.address === config.zeroAddress
      )

      if (ethIndex > -1) {
        list.splice(ethIndex, 0, {
          symbol: 'eth',
          balance: ethBalance,
        })
      }

      setTokenInfo(list)
      setTokenBalance(list.map((i) => i.balance))
      setTokenContracts(_tokenContracts)
    } catch (error) {
      console.log(error)
    }
  }, [multiCallsV2, erc20Contract, _currentAccount, web3, options])

  useEffect(() => {
    fetchUserInfo()
  }, [_currentAccount, blockNumber])

  return {
    tokenContracts,
    tokenBalance,
    tokenInfo,
  }
}

export const useToken = (address, contractType, lpInfo) => {
  const { _currentAccount, web3, blockNumber, isAllReady } = useWeb3()
  const multiCallsV2 = useMutiCallV2()
  const { erc20Contract } = useContract()
  const [token, setToken] = useState({
    balance: 0,
    allowance: 0,
  })

  const fetchUserInfo = useCallback(async () => {
    try {
      // console.log('fetchUserInfo----', address)
      if (address === config.zeroAddress) {
        const ethBalance = await web3.eth.getBalance(_currentAccount)
        console.log('ethBalance----', ethBalance)
        setToken({
          address,
          balance: ethBalance,
          allowance: ethBalance,
          contract: erc20Contract(address),
        })
      } else {
        let _contractAddress
        console.log('contractType------', contractType)
        switch (contractType) {
          case 'ido':
            _contractAddress = config.contracts.idoSale
            break
          case 'fx_stETH_mint':
            _contractAddress = config.contracts.fx_Market
            break
          case 'fx_redeem':
            _contractAddress = config.contracts.fx_Market
            break
          case 'fx_ethGateway':
            _contractAddress = config.contracts.fx_ETHGateway
            break
          case 'fx_fxGateway':
            _contractAddress = config.contracts.fx_FxGateway
            break
          case 'fx_RebalancePool_A':
            _contractAddress = config.contracts.fx_RebalancePool_A
            break
          case 'fx_gauge':
            _contractAddress = lpInfo.lpGaugeAddress
            break
          case 'fxUSD_gateway_router':
            _contractAddress = config.contracts.fxUSD_GatewayRouter
            break
          case 'fxUSD':
            _contractAddress = config.tokens.fxUSD
            break
          case 'rUSD':
            _contractAddress = config.tokens.rUSD
            break
          case 'btcUSD':
            _contractAddress = config.tokens.btcUSD
            break
          default:
            _contractAddress = contractType
            break
        }
        const tokenContract = erc20Contract(address)
        const calls = [
          tokenContract.methods.balanceOf(_currentAccount),
          tokenContract.methods.allowance(_currentAccount, _contractAddress),
        ]
        const [balance, allowance] = await multiCallsV2(calls)

        setToken({
          balance,
          allowance,
          contractAddress: _contractAddress,
          contract: tokenContract,
        })
      }
    } catch (error) {
      console.log(error)
    }
  }, [
    _currentAccount,
    web3,
    erc20Contract,
    multiCallsV2,
    address,
    contractType,
    lpInfo,
  ])

  useEffect(() => {
    if (isAllReady && address) {
      fetchUserInfo()
    } else {
      setToken({ balance: 0, allowance: 0 })
    }
  }, [web3, blockNumber, _currentAccount, isAllReady, contractType, address])

  return token
}

export const useTokenBalance = (address) => {
  const { _currentAccount, web3, blockNumber, isAllReady } = useWeb3()
  const { erc20Contract } = useContract()
  const [balance, setBalance] = useState({
    balance: 0,
  })

  const fetchUserInfo = useCallback(async () => {
    try {
      const tokenContract = erc20Contract(address)
      const _balance = await tokenContract.methods
        .balanceOf(_currentAccount)
        .call()
      setBalance({
        balance: _balance,
        contract: tokenContract,
      })
    } catch (error) {
      console.log(error)
    }
  }, [_currentAccount, web3, erc20Contract, address])

  useEffect(() => {
    if (isAllReady && address) {
      fetchUserInfo()
    } else {
      setBalance({
        balance,
      })
    }
  }, [web3, blockNumber, _currentAccount, isAllReady, address])

  return balance
}

export default useTokens
