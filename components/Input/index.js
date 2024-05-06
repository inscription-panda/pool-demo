import React, { useEffect, useState } from 'react'
import cn from 'classnames'
import Visible from '@/components/Visible'
import styles from './styles.module.scss'
import { fb4, cBN } from '@/utils/index'

export function Info({ name, value, extraClass }) {
  return (
    <div className="flex items-center gap-1">
      <div>{name}: </div>
      <div className={`text-[14px] ${extraClass}`}>{value}</div>
    </div>
  )
}

export default function Input(props) {
  const {
    defaultValue,
    balance,
    label,
    labelDes,
    token,
    vaultWithdrawFee,
    feeName,
    decimals,
    available,
    BottomElement,
    calculatorLink,
    depositFor,
    placeholder,
    withdrawFee,
    onChange = () => {},
    hidePercent,
    ExtraButton,
    hideMax,
    reset,
    ...others
  } = props
  const [percent, setPercent] = useState(0)
  const [value, setValue] = useState('')

  const percents = [25, 50, 75, 100]

  useEffect(() => {
    const val = cBN(defaultValue)
      .shiftedBy(-(decimals ?? 18))
      .toFixed(3, 1)
    setValue(val)
    onChange(defaultValue, 100)
  }, [defaultValue])

  useState(() => {
    setPercent(0)
  }, [value])

  useEffect(() => {
    setPercent(0)
    setValue('')
    onChange(0)
  }, [reset])

  const percentChange = (_percent) => {
    setPercent(_percent)

    if (balance && !cBN(balance).isZero() && !cBN(balance).isNaN()) {
      const _value = cBN(balance).times(_percent).div(100)
      setValue(fb4(_value, false, decimals ?? 18))
      onChange(_value, _percent)
    }

    if (available && !cBN(available).isZero() && !cBN(available).isNaN()) {
      const val = cBN(available).times(_percent).div(100)
      setValue(fb4(val, false, decimals ?? 18))
      onChange(val, _percent)
    }
  }

  const handleInputChange = (e) => {
    setPercent(0)
    let _value = e.target.value
    // eslint-disable-next-line prefer-regex-literals
    const valString = new RegExp(/,/g)
    const charReg = /[^\d.]/g
    if (valString.test(_value)) {
      _value = _value.replace(/,/g, '')
    }

    if (charReg.test(_value)) {
      _value = _value.replace(charReg, '')
    }

    if (value === '0' && _value.indexOf('.') === -1) {
      _value = _value.slice(1)
    }

    setValue(_value)
    onChange(cBN(_value || 0).shiftedBy(decimals ?? 18), percent)
  }

  const handleMax = () => percentChange(100)

  return (
    <div className={styles.inputWrapper} style={others.style ?? {}}>
      <div className={styles.inputTop}>
        {!hidePercent && !cBN(balance).isNaN() && (
          <Info
            name="Balance"
            value={`${fb4(balance, false, decimals ?? 18)} ${token}`}
            extraClass="color-blue"
          />
        )}
        {!hidePercent && !cBN(available).isNaN() && (
          <Info
            name="Available"
            value={`${fb4(available, false, decimals ?? 18)} ${token}`}
          />
        )}
        {!hidePercent && (
          <div className={styles.percents}>
            {percents.map((item) => (
              <div
                key={item}
                className={cn(
                  styles.percent,
                  item === percent && styles.active
                )}
                onClick={() => percentChange(item)}
              >
                {item}%
              </div>
            ))}
          </div>
        )}
      </div>
      {label && (
        <div className=" form-label text-xl flex items-center justify-between">
          <span dangerouslySetInnerHTML={{ __html: label }} />
          {labelDes}
        </div>
      )}
      <div className="flex gap-4 my-3">
        <div className="relative w-full">
          <input
            onChange={handleInputChange}
            value={value}
            placeholder={placeholder}
          />
          <Visible visible={hidePercent && !hideMax}>
            <a
              className="color-blue underline absolute right-3 top-2"
              onClick={handleMax}
            >
              MAX
            </a>
          </Visible>
        </div>
        {ExtraButton && <ExtraButton />}
      </div>

      <div className={styles.inputBottom}>
        {BottomElement && <BottomElement />}
        {vaultWithdrawFee && (
          <Info
            name={`${feeName || 'Vault Withdraw'} Fee`}
            value={vaultWithdrawFee || '-'}
          />
        )}
        {withdrawFee && (
          <Info
            name={`${feeName || 'Withdraw'} Fee`}
            value={withdrawFee || '-'}
          />
        )}
        {depositFor && <Info name="Deposit for" value={depositFor || '-'} />}
      </div>
    </div>
  )
}
