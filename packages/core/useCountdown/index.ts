import type { MaybeRefOrGetter, Pausable, MaybeRef } from '@vueuse/shared'
import type { Ref } from 'vue'
import { useIntervalFn } from '@vueuse/shared'
import { ref, toValue, unref, watchEffect } from 'vue'

export interface UseCountdownOptions {
  /**
   *  Interval for the countdown in milliseconds. Default is 1000ms.
   */
  interval?: MaybeRefOrGetter<number>
  /**
   * Callback function called when the countdown reaches 0.
   */
  onComplete?: MaybeRef<() => void>
  /**
   * Callback function called on each tick of the countdown.
   */
  onTick?: () => void
  /**
   * Start the countdown immediately
   *
   * @default false
   */
  immediate?: boolean
}

export interface UseCountdownReturn extends Pausable {
  /**
   * Current countdown value.
   */
  remaining: Ref<number>
  /**
   * Resets the countdown and repeatsLeft to their initial values.
   */
  reset: () => void
  /**
   * Stops the countdown and resets its state.
   */
  stop: () => void
  /**
   * Reset the countdown and start it again.
   */
  start: (initialCountdown?: MaybeRefOrGetter<number>) => void
}

/**
 * Wrapper for `useIntervalFn` that provides a countdown timer in seconds.
 *
 * @param initialCountdown
 * @param options
 *
 * @see https://vueuse.org/useCountdown
 */
export function useCountdown(initialCountdown: MaybeRefOrGetter<number>, options?: UseCountdownOptions): UseCountdownReturn {
  const remaining = ref(toValue(initialCountdown))
  const onComplete = ref(options?.onComplete)

  watchEffect(() => {
    onComplete.value = unref(options?.onComplete)
  })

  const intervalController = useIntervalFn(() => {
    const value = remaining.value - 1
    remaining.value = value < 0 ? 0 : value
    options?.onTick?.()
    if (remaining.value <= 0) {
      intervalController.pause()
     onComplete.value?.()
    }
  }, options?.interval ?? 1000, { immediate: options?.immediate ?? false })

  const reset = () => {
    remaining.value = toValue(initialCountdown)
  }

  const stop = () => {
    intervalController.pause()
    reset()
  }

  const resume = () => {
    if (!intervalController.isActive.value) {
      if (remaining.value > 0) {
        intervalController.resume()
      }
    }
  }

  const start = () => {
    reset()
    intervalController.resume()
  }

  return {
    remaining,
    reset,
    stop,
    start,
    pause: intervalController.pause,
    resume,
    isActive: intervalController.isActive,
  }
}
