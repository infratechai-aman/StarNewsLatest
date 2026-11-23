// Fail fast instead of hanging 20 s+ while the Firestore client retries
// (BUG-018). The route's existing catch block turns this into a quick error
// response, and the client falls back to its own fetch / cached data.
export function withDeadline(promise, ms = 6000) {
  let timer
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(Object.assign(new Error(`Firestore call exceeded ${ms} ms`), { code: 'DEADLINE_EXCEEDED' })), ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}
