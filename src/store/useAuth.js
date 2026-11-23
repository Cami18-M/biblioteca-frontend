import { create } from 'zustand'

const useAuth = create(() => ({
  user: null,
  token: null,
}))

export default useAuth
