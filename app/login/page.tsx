/*"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const { login, isLoading } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    try {
      await login(email, password)
      router.push("/dashboard")
    } catch (err) {
      setError("Invalid credentials. Please try again.")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="glass-light w-full max-w-md p-8 rounded-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-700 dark:text-green-400 mb-2">Farm Management</h1>
          <p className="text-muted-foreground">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-md border border-blue-200 dark:border-blue-800">
          <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-3">Demo Credentials:</p>
          <div className="space-y-2 text-xs">
            <p>
              <span className="font-medium">Super Admin (Abdullah Khan):</span> admin@farm.com
            </p>
            <p>
              <span className="font-medium">Owner (Waleed Ahmed):</span> waleed@farm.com
            </p>
            <p>
              <span className="font-medium">Manager (Shayan Ali):</span> shayan@farm.com
            </p>
            <p className="text-muted-foreground italic mt-2">Password: Not required for demo</p>
          </div>
        </div>
      </div>
    </div>
  )
}
  */


"use client"

import type React from "react"
import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Leaf, Mail, Lock, Tractor, User, Building2, ClipboardCheck } from "lucide-react"

export default function LoginPage() {
  // --- YOUR EXACT LOGIC (Restored) ---
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const { authenticate, isLoading } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    try {
      const destination = await authenticate(email, password)
      router.push(destination)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid credentials. Please try again.")
    }
  }
  // -------------------------------------

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950 p-4 relative overflow-hidden">
      
      {/* Decorative Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-emerald-300/30 rounded-full mix-blend-multiply filter blur-3xl animate-pulse dark:bg-emerald-900/20"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-teal-300/30 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000 dark:bg-teal-900/20"></div>

      {/* Glassmorphic Card */}
      <div className="w-full max-w-md bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden z-10 relative">
        
        {/* Header Section */}
        <div className="bg-gradient-to-b from-emerald-50/50 to-transparent dark:from-emerald-900/20 p-8 text-center border-b border-white/20">
          <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg transform rotate-3 hover:rotate-6 transition-transform">
            <Tractor className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-emerald-950 dark:text-emerald-50 tracking-tight">Farm Management</h1>
          <p className="text-emerald-600/80 dark:text-emerald-400 text-sm mt-2 font-medium">Smart Livestock System</p>
        </div>

        {/* Form Section */}
        <div className="p-8 pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Email Input with Icon */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@farm.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="pl-10 h-12 bg-white/50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 focus:ring-emerald-500 focus:border-emerald-500 transition-all rounded-xl"
                />
              </div>
            </div>

            {/* Password Input with Icon */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="pl-10 h-12 bg-white/50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 focus:ring-emerald-500 focus:border-emerald-500 transition-all rounded-xl"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900 text-red-600 dark:text-red-300 text-sm flex items-center animate-in fade-in slide-in-from-top-1">
                <span className="mr-2">⚠️</span> {error}
              </div>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full h-12 text-base font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all rounded-xl" 
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In to Dashboard"}
            </Button>
          </form>

          {/* Clean Demo Credentials Section */}
          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 text-center">
              Quick Demo Access (Click to fill)
            </p>
            <div className="grid gap-3">
              <div 
                onClick={() => setEmail('admin@farm.com')}
                className="group flex items-center p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border border-gray-100 dark:border-gray-700 cursor-pointer transition-colors"
              >
                <div className="bg-purple-100 dark:bg-purple-900/50 p-2 rounded-lg mr-3 text-purple-600 dark:text-purple-300">
                  <User size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Super Admin</p>
                  <p className="text-xs text-gray-500 font-mono">admin@farm.com</p>
                </div>
              </div>
              
              <div 
                onClick={() => setEmail('waleed@farm.com')}
                className="group flex items-center p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-gray-100 dark:border-gray-700 cursor-pointer transition-colors"
              >
                <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-lg mr-3 text-blue-600 dark:text-blue-300">
                  <Building2 size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Farm Owner</p>
                  <p className="text-xs text-gray-500 font-mono">waleed@farm.com</p>
                </div>
              </div>

              <div 
                onClick={() => setEmail('shayan@farm.com')}
                className="group flex items-center p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 hover:bg-orange-50 dark:hover:bg-orange-900/20 border border-gray-100 dark:border-gray-700 cursor-pointer transition-colors"
              >
                <div className="bg-orange-100 dark:bg-orange-900/50 p-2 rounded-lg mr-3 text-orange-600 dark:text-orange-300">
                  <ClipboardCheck size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Manager</p>
                  <p className="text-xs text-gray-500 font-mono">shayan@farm.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}