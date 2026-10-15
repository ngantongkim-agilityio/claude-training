import { AsyncLocalStorage } from 'async_hooks'

export type RequestContext = {
  requestId: string
}

export const requestAsyncContext = new AsyncLocalStorage<RequestContext>()
