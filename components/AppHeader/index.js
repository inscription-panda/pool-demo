import React, { useRef, useCallback, useState, useEffect, useMemo } from 'react'
import cn from 'classnames'
import { useSelector } from 'react-redux'
import Link from 'next/link'
import { useToggle, useClickAway } from 'ahooks'
import {
  MenuOutlined,
  CloseOutlined,
  ShareAltOutlined,
} from '@ant-design/icons'
import { useRouter } from 'next/router'
import useWeb3 from '@/hooks/useWeb3'
import useGlobal from '@/hooks/useGlobal'
import styles from './styles.module.scss'
import config from '@/config/index'
import Select from '@/components/Select'
import Menu from '@/components/menu'

const routers = []

export default function AppHeader() {
  const { showMenuPanel, toggleShowMenuPanel } = useGlobal()
  const {
    connect,
    disconnect,
    currentAccount,
    switchChain,
    currentChainId,
    settingChain,
    isAllowChain,
    blockTime,
  } = useWeb3()
  const { route, push } = useRouter()
  const [showAccountPanel, { toggle: toggleShowAccountPanel }] = useToggle()
  const [openFAQ, { toggle: toggleFAQ }] = useToggle()

  const refMenu = useRef(null)
  const refMenuMobile = useRef(null)
  const refMenuPanel = useRef(null)

  const targets = [refMenu, refMenuMobile, refMenuPanel]

  useClickAway(() => {
    if (showMenuPanel) {
      toggleShowMenuPanel()
    }
  }, targets)

  const refAccount = useRef(null)
  const refAccountPanel = useRef(null)
  useClickAway(() => {
    if (showAccountPanel) {
      toggleShowAccountPanel()
    }
  }, [refAccount, refAccountPanel])

  const _account = useMemo(
    () =>
      currentAccount
        ? `${currentAccount.slice(0, 6)}...${currentAccount.slice(-6)}`
        : '',
    [currentAccount]
  )

  const historyUrl = useMemo(
    () =>
      currentAccount ? `https://etherscan.io/address/${currentAccount}` : '',
    [currentAccount]
  )

  const handleDisconnect = () => {
    disconnect()
    toggleShowAccountPanel()
  }

  const handleConnect = () => {
    connect()
  }

  useEffect(() => {
    if (!isAllowChain) {
      switchChain()
    }
  }, [isAllowChain, switchChain])

  const showNotice = useMemo(
    () => new Date().getTime() < 1695906000000,
    [blockTime]
  )

  const MORE_LIST = [
    {
      label: 'Booster',
      onClick: () => push('/booster'),
      url: '/booster',
    },
    {
      label: 'Vesting',
      onClick: () => push('/vesting'),
      url: '/vesting',
    },
    {
      label: 'Rebalance Pool (Deprecated)',
      onClick: () => push('/rebalance-pool'),
      url: '/rebalance-pool',
    },
    {
      label: 'Governance',
      onClick: () => window.open('https://snapshot.org/#/fxn.eth', '_blank'),
    },
  ]

  return (
    <div>
      <div className={styles.container}>
        <div className={styles.mobile}>
          <Link href="/assets">
            <img className={styles.logo} src="/images/FXN.svg" />
          </Link>
          <div
            onClick={currentAccount ? toggleShowAccountPanel : handleConnect}
            className={styles.account}
            ref={refAccount}
          >
            <p>{currentAccount ? _account : 'Connect Wallet'}</p>
          </div>
          <div className={styles.menu} onClick={toggleShowMenuPanel}>
            <MenuOutlined ref={refMenuMobile} />
          </div>
        </div>

        <div className={styles.right}>
          {/* <a
            className={styles.faucet}
            target="_blank"
            href="https://docs.google.com/forms/d/e/1FAIpQLScewYkjwJ5pdxQDD0GGSiVbQTE4GgDJ8tf-l5wRIEGpHjwFTw/viewform"
            rel="noreferrer"
          >
            Faucet
          </a> */}
          <Select
            value={currentChainId}
            style={{ minWidth: '130px', marginRight: '16px' }}
            onChange={(val) => switchChain(val)}
            options={config.allowChains.map((item) => ({
              value: item.id,
              label: item.label,
            }))}
            disabled={settingChain}
          />
          <div
            onClick={currentAccount ? toggleShowAccountPanel : handleConnect}
            className={styles.account}
            ref={refAccount}
          >
            <p>{currentAccount ? _account : 'Connect Wallet'}</p>
          </div>
          <div className="w-0" onClick={toggleShowMenuPanel} ref={refMenu} />
        </div>
      </div>

      {isAllowChain ? null : (
        <p className={styles.network}>
          Please switch your network to{' '}
          {config.allowChains.map((item) => item.label).join(' or ')}
        </p>
      )}
    </div>
  )
}
