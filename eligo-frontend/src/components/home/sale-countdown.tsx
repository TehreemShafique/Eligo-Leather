"use client"

import { useEffect, useState } from "react"

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

const INITIAL_TIME: TimeLeft = {
  days: 4,
  hours: 12,
  minutes: 35,
  seconds: 22,
}

const DESKTOP_SEPARATOR_OFFSETS = [
  "min-[1920px]:translate-y-0!",
  "min-[1920px]:translate-y-px!",
  "min-[1920px]:translate-y-[2px]!",
] as const

function formatTwoDigits(value: number) {
  return String(value).padStart(2, "0")
}

function TimerBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-[7px] border border-yellow-400 sm:h-16 sm:w-16 md:h-20 md:w-20 md:rounded-[8px] min-[1920px]:h-24! min-[1920px]:w-24! min-[1920px]:justify-start! min-[1920px]:gap-[5px]! min-[1920px]:rounded-[10px]! min-[1920px]:pt-[6px]!">
      <span className="text-2xl font-normal leading-7 text-yellow-400 sm:text-3xl sm:leading-8 md:text-4xl md:leading-10 min-[1920px]:text-5xl! min-[1920px]:leading-[50px]!">
        {formatTwoDigits(value)}
      </span>

      <span className="text-[10px] font-normal leading-4 text-white sm:text-xs md:text-sm md:leading-5 min-[1920px]:text-lg! min-[1920px]:leading-8!">
        {label}
      </span>
    </div>
  )
}

function Separator({ index }: { index: 0 | 1 | 2 }) {
  return (
    <div
      aria-hidden="true"
      className={`flex w-4 shrink-0 flex-col items-center justify-center gap-1 sm:w-6 md:w-8 min-[1920px]:h-[14px]! min-[1920px]:w-12! min-[1920px]:justify-start! min-[1920px]:gap-[5px]! min-[1920px]:pt-px! ${DESKTOP_SEPARATOR_OFFSETS[index]}`}
    >
      <span className="h-1 w-1 rounded-full bg-yellow-400 min-[1920px]:translate-x-[2px]!" />
      <span className="h-1 w-1 rounded-full bg-yellow-400 min-[1920px]:translate-x-[2px]!" />
    </div>
  )
}

export function SaleCountdown() {
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIME)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTimeLeft((previous) => {
        if (previous.seconds > 0) {
          return { ...previous, seconds: previous.seconds - 1 }
        }

        if (previous.minutes > 0) {
          return { ...previous, minutes: previous.minutes - 1, seconds: 59 }
        }

        if (previous.hours > 0) {
          return {
            ...previous,
            hours: previous.hours - 1,
            minutes: 59,
            seconds: 59,
          }
        }

        if (previous.days > 0) {
          return {
            days: previous.days - 1,
            hours: 23,
            minutes: 59,
            seconds: 59,
          }
        }

        return previous
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [])

  return (
    <div
      role="timer"
      aria-live="off"
      aria-label={`${timeLeft.days} days, ${timeLeft.hours} hours, ${timeLeft.minutes} minutes, and ${timeLeft.seconds} seconds remaining`}
      className="flex w-full items-center justify-center"
    >
      <TimerBox value={timeLeft.days} label="Days" />
      <Separator index={0} />

      <TimerBox value={timeLeft.hours} label="Hours" />
      <Separator index={1} />

      <TimerBox value={timeLeft.minutes} label="Mins" />
      <Separator index={2} />

      <TimerBox value={timeLeft.seconds} label="Secs" />
    </div>
  )
}