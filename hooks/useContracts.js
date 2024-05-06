import { useCallback, useMemo, useState, useEffect } from 'react'
import config from '@/config/index'
import abi from '@/config/abi'
import useWeb3 from '@/hooks/useWeb3'
import { useMutiCall } from '@/hooks/useMutiCalls'

export const useContract = (theAddr, theAbi) => {
  const { web3 } = useWeb3()

  const getContract = useCallback(
    (_address, _abi) => new web3.eth.Contract(_abi, _address),
    [web3]
  )

  const erc20Contract = useCallback(
    (_address) => getContract(_address, abi.erc20ABI),
    [getContract]
  )

  const contract = useMemo(() => {
    if (theAddr && theAbi) {
      return getContract(theAddr, theAbi)
    }
    return null
  }, [theAddr, theAbi, getContract])

  return { getContract, erc20Contract, contract }
}

export const useErc20Token = (tokenAddr, approveForAddr) => {
  const multiCall = useMutiCall()

  const { blockNumber, _currentAccount, web3 } = useWeb3()
  const [tokenInfo, setTokenInfo] = useState({ balance: 0, allowance: 0 })

  const { contract: tokenContract } = useContract(tokenAddr, abi.erc20ABI)

  const fetchTokenInfo = async () => {
    const { balanceOf: tokenBalanceOf, allowance: tokenAllowance } =
      tokenContract.methods
    try {
      const calls = [
        tokenBalanceOf(_currentAccount),
        tokenAllowance(_currentAccount, approveForAddr),
      ]
      const [balance, allowance] = await multiCall(...calls)

      setTokenInfo({ balance, allowance })
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    if (web3 && tokenContract) {
      fetchTokenInfo()
    }
  }, [web3, blockNumber, tokenContract, _currentAccount])

  return {
    tokenContract,
    tokenInfo,
  }
}

export const useBalancerContract = () => {
  const address = '0xdcdbf71a870cc60c6f9b621e28a7d3ffd6dd4965'
  const { getContract } = useContract()
  return useMemo(
    () => ({
      contract: getContract(address, abi.balancerABI),
      address,
    }),
    [getContract]
  )
}

export const useLayerContract = () => {
  const address = '0xba12222222228d8ba445958a75a0704d566bf2c8'
  const { getContract } = useContract()
  return useMemo(
    () => ({
      contract: getContract(address, abi.layerABI),
      address,
    }),
    [getContract]
  )
}
