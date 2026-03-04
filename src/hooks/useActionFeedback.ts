import { useState, useEffect, useCallback } from 'react'
import { getConn } from '../lib/connection'

const errorToString = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}

export interface ActionFeedback {
  actionError: string | null
  actionStatus: string | null
  setActionError: (err: string | null) => void
  setActionStatus: (status: string | null) => void
  runAction: (fn: () => Promise<void>, successStatus?: string) => Promise<void>
  callActionOrReducer: <TParams extends Record<string, unknown>>(
    actionFn: ((params: TParams) => Promise<void>) | undefined,
    reducerName: string,
    params: TParams,
  ) => Promise<void>
}

export function useActionFeedback(): ActionFeedback {
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionStatus, setActionStatus] = useState<string | null>(null)

  // Auto-dismiss toast notifications after 5 seconds
  useEffect(() => {
    if (actionStatus || actionError) {
      const timer = setTimeout(() => {
        setActionStatus(null)
        setActionError(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [actionStatus, actionError])

  const runAction = useCallback(
    async (fn: () => Promise<void>, successStatus?: string): Promise<void> => {
      setActionError(null)
      setActionStatus(null)
      try {
        await fn()
        if (successStatus) {
          setActionStatus(successStatus)
        }
      } catch (error) {
        setActionError(errorToString(error))
      }
    },
    [],
  )

  const callActionOrReducer = useCallback(
    async <TParams extends Record<string, unknown>>(
      actionFn: ((params: TParams) => Promise<void>) | undefined,
      reducerName: string,
      params: TParams,
    ): Promise<void> => {
      if (actionFn) {
        await actionFn(params)
        return
      }

      const reducers = getConn().reducers as unknown as Record<
        string,
        ((value: TParams) => Promise<void>) | undefined
      >
      const reducer = reducers[reducerName]
      if (!reducer) {
        throw new Error(`Reducer not available: ${reducerName}`)
      }
      await reducer(params)
    },
    [],
  )

  return {
    actionError,
    actionStatus,
    setActionError,
    setActionStatus,
    runAction,
    callActionOrReducer,
  }
}
