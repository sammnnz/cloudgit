import { authAPI } from './auth'
import { repoAPI } from './repo'

// Группировка API
export const API = {
  auth: authAPI,
  repo: repoAPI,
}