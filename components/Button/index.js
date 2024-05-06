import React from 'react'
import cn from 'classnames'
import { LoadingOutlined } from '@ant-design/icons'

import styles from './styles.module.scss'

export default function Button({
  width,
  height,
  onClick,
  loading,
  style,
  children,
  disabled,
  theme,
  size,
  type = 'second', // 'default',
  className,
}) {
  const handClick = () => {
    if (!loading && !disabled && onClick) {
      onClick()
    }
  }

  return (
    <button
      className={cn(styles.btn, styles[theme], styles[size], className)}
      data-type={type}
      onClick={handClick}
      disabled={disabled || loading}
      style={{ width, height, ...style }}
    >
      {children} {loading ? <LoadingOutlined /> : null}
    </button>
  )
}
