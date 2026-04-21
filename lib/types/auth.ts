export interface User {
    id: number
    username: string
    name: string
    role_id: number
    email: string
    type: "student" | "teacher" | "admin" 
    role?: string // Add role for UI/permission logic
    avatar?: string // Add avatar for UI
    sub_type: string
  }
  
  export interface LoginResponse {
    code: number
    message: string
    data: {
      message: string
      token: string
      user: User
    }[]
  }
  
  export interface AuthState {
    user: User | null
    token: string | null
    isAuthenticated: boolean
    isLoading: boolean
    error: string | null
  }
