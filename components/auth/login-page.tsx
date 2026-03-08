"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

export function LoginPage() {
    const router = useRouter()
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setIsLoading(true)

        const allowedUsers = [
            {
                email: process.env.NEXT_PUBLIC_AUTH_USER1_EMAIL || "user1@afed.com.my",
                password: process.env.NEXT_PUBLIC_AUTH_USER1_PASSWORD || "Testing123!",
                token: "user1",
            },
            {
                email: process.env.NEXT_PUBLIC_AUTH_USER2_EMAIL || "user2@afed.com.my",
                password: process.env.NEXT_PUBLIC_AUTH_USER2_PASSWORD || "Testing123!",
                token: "user2",
            },
        ]

        const match = allowedUsers.find(
            (user) => user.email === email && user.password === password
        )

        if (!match) {
            setError("Invalid email or password")
            setIsLoading(false)
            return
        }

        // Persist a simple token so the app can distinguish between the two users
        if (typeof window !== "undefined") {
            try {
                window.localStorage.setItem("afed_vdr_auth_token", match.token)
                window.localStorage.setItem("afed_vdr_auth_email", email)
            } catch (e) {
                console.warn("Failed to persist auth token", e)
            }
        }

        // Simulate login delay then navigate to workspace
        setTimeout(() => {
            router.push("/workspace")
        }, 400)
    }

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-slate-100 p-4 lg:p-8">
            {/* Centered Card Container */}
            <div className="flex w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl shadow-slate-200/50 lg:h-[600px]">

                {/* Left Side - Login Form */}
                <div className="flex w-full flex-col justify-center px-8 py-12 lg:w-1/2 lg:px-16">
                    <div className="mx-auto w-full max-w-[360px]">
                        <div className="mb-10 flex items-center gap-6">
                            <Image
                                src="/LOGO-VDR.svg"
                                alt="NDR Logo"
                                width={120}
                                height={40}
                                className="h-10 w-auto"
                                priority
                            />
                            <div className="h-8 w-px bg-slate-200" />
                            <span className="text-xl font-bold text-slate-900 tracking-tight uppercase leading-tight">Offshore & <br />Onshore Netherlands</span>
                        </div>

                        <div className="mb-8">
                            <h1 className="mb-2 text-2xl font-bold text-slate-900">Welcome Back</h1>
                            <p className="text-sm text-slate-500">Enter your credentials to access the workspace.</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-500">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@company.com"
                                    className="bg-slate-50 border-slate-200 focus-visible:ring-primary focus-visible:border-primary h-10 dark:bg-slate-50 dark:border-slate-200 dark:text-slate-900 dark:placeholder:text-slate-400"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" title="Password Label" className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-500">Password</Label>
                                    <Link href="#" className="text-xs font-medium text-primary hover:text-primary/80 dark:text-primary">
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter your password"
                                        className="bg-slate-50 border-slate-200 pr-10 focus-visible:ring-primary focus-visible:border-primary h-10 dark:bg-slate-50 dark:border-slate-200 dark:text-slate-900 dark:placeholder:text-slate-400"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-400"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2 pt-1">
                                <Checkbox id="remember" className="data-[state=checked]:bg-primary data-[state=checked]:border-primary dark:bg-white dark:border-slate-200" />
                                <label
                                    htmlFor="remember"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-600 dark:text-slate-600"
                                >
                                    Keep me logged in
                                </label>
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white h-11 text-sm font-medium shadow-lg shadow-slate-900/20 mt-2 transition-all hover:scale-[1.01]"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                        Signing in...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        Sign in to Workspace <ArrowRight size={16} />
                                    </span>
                                )}
                            </Button>

                            {error && (
                                <p className="mt-3 text-xs text-red-500 font-medium">
                                    {error}
                                </p>
                            )}
                        </form>

                        <div className="mt-8 text-center text-xs text-slate-400">
                            By signing in, you agree to our <Link href="#" className="underline hover:text-slate-600">Terms of Service</Link> and <Link href="#" className="underline hover:text-slate-600">Privacy Policy</Link>.
                        </div>
                    </div>
                </div>

                {/* Right Side - Futuristic Visuals (VDR Style) */}
                <div className="hidden lg:flex w-1/2 relative bg-slate-900 overflow-hidden">
                    <Image
                        src="/images/login-globe.png"
                        alt="Netherlands VDR Globe"
                        fill
                        className="object-cover opacity-90"
                        priority
                    />

                    {/* Gradient Overlay for Text Readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent z-0"></div>

                    {/* Content Overlay */}
                    <div className="relative z-10 flex flex-col justify-between h-full p-12 text-white">
                        <div className="flex justify-end">
                            <div className="flex gap-1">
                                <div className="h-1 w-8 bg-accent rounded-full"></div>
                                <div className="h-1 w-2 bg-slate-600 rounded-full"></div>
                                <div className="h-1 w-2 bg-slate-600 rounded-full"></div>
                            </div>
                        </div>

                        <div>
                            <div className="inline-flex items-center rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent mb-6 backdrop-blur-sm">
                                <span className="flex h-2 w-2 rounded-full bg-accent mr-2 animate-pulse"></span>
                                Secure Environment
                            </div>
                            <h2 className="text-3xl font-bold leading-tight mb-4 tracking-tight drop-shadow-lg">
                                Accelerate Your <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Exploration Success</span>
                            </h2>
                            <p className="text-slate-200 text-sm leading-relaxed max-w-sm drop-shadow-md">
                                Advanced subsurface visualization and data management for the Netherlands&apos; energy sector. Access verified data in a secure, collaborative environment.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
