export const FAILURE_RATE = 0.2
export const LATENCY_MS = 600

export function simulatePatchStatus(): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      Math.random() < FAILURE_RATE ? reject(new Error('PATCH /tickets/:id failed')) : resolve()
    }, LATENCY_MS)
  })
}
