const TOKEN = 'kurio-token'
const GUEST = 'kurio-guest-id'

export const getToken = () => localStorage.getItem(TOKEN)
export const setToken = (t: string) => localStorage.setItem(TOKEN, t)
export const clearToken = () => localStorage.removeItem(TOKEN)

export function getGuestId() {
  let id = localStorage.getItem(GUEST)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(GUEST, id)
  }
  return id
}
export const resetGuestId = () => localStorage.removeItem(GUEST)