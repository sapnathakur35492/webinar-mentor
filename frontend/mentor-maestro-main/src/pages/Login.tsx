import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Zap, ArrowRight, Sparkles } from "lucide-react";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showErrors, setShowErrors] = useState(false);

    const { signIn } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setShowErrors(true);

        if (!email || !password) {
            toast.error("Please fill in all fields");
            return;
        }

        setIsLoading(true);
        try {
            const { error } = await signIn(email, password);
            if (error) throw error;

            toast.success("Welcome back!");
            navigate("/");
        } catch (error: any) {
            toast.error(error.message || "Login failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen h-screen w-full relative flex items-center justify-center lg:justify-end overflow-hidden">
            {/* Background Image with enhanced overlay */}
            <div
                className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: 'url("/auth-bg-final.png")',
                }}
            >
                <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/30 to-transparent"></div>
            </div>

            {/* Decorative floating elements */}
            <div className="fixed top-20 left-20 w-72 h-72 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
            <div className="fixed bottom-20 right-40 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />

            {/* Login Card - Premium glassmorphism */}
            <Card className="z-10 w-full max-w-[500px] bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl border border-white/10 text-white shadow-2xl relative rounded-3xl lg:mr-20 overflow-hidden">
                {/* Card glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-purple-500/5" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-500/50 to-transparent" />

                <div className="relative p-8 md:p-10">
                    {/* Header with Logo */}
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-6">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl blur-xl opacity-50 animate-pulse" />
                                <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg shadow-green-500/30">
                                    <Zap className="h-10 w-10 text-white" strokeWidth={2.5} />
                                </div>
                            </div>
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
                        <p className="text-gray-400">Sign in to your mentor portal</p>
                    </div>

                    <CardContent className="p-0">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Email */}
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium text-gray-300">
                                    Email Address
                                </Label>
                                <div className="relative group">
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="your@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className={`h-14 bg-white/5 text-white border-2 ${showErrors && !email ? "border-red-500" : "border-white/10"
                                            } focus:border-green-500 focus:ring-2 focus:ring-green-500/20 rounded-xl placeholder:text-gray-500 transition-all duration-300`}
                                    />
                                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-500/0 via-green-500/5 to-green-500/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                </div>
                                {showErrors && !email && (
                                    <p className="text-xs text-red-400 font-medium flex items-center gap-1">
                                        <span className="w-1 h-1 bg-red-400 rounded-full" />
                                        Email is required
                                    </p>
                                )}
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-sm font-medium text-gray-300">
                                    Password
                                </Label>
                                <div className="relative group">
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className={`h-14 bg-white/5 text-white border-2 ${showErrors && !password ? "border-red-500" : "border-white/10"
                                            } focus:border-green-500 focus:ring-2 focus:ring-green-500/20 rounded-xl placeholder:text-gray-500 transition-all duration-300`}
                                    />
                                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-500/0 via-green-500/5 to-green-500/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                </div>
                                {showErrors && !password && (
                                    <p className="text-xs text-red-400 font-medium flex items-center gap-1">
                                        <span className="w-1 h-1 bg-red-400 rounded-full" />
                                        Password is required
                                    </p>
                                )}
                            </div>

                            {/* Forgot Password Link */}
                            <div className="flex justify-end">
                                <a href="#" className="text-sm text-gray-400 hover:text-green-400 transition-colors">
                                    Forgot password?
                                </a>
                            </div>

                            {/* Login Button - Premium with glow */}
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="relative w-full h-14 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-bold text-lg rounded-xl shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] overflow-hidden group"
                            >
                                {/* Button glow animation */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

                                {isLoading ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    <span className="flex items-center justify-center gap-2 relative z-10">
                                        Sign In
                                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                    </span>
                                )}
                            </Button>

                            {/* Divider */}
                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-white/10"></div>
                                </div>
                                <div className="relative flex justify-center text-xs">
                                    <span className="px-4 bg-gray-900 text-gray-500">New to Change 2.0?</span>
                                </div>
                            </div>

                            {/* Signup Link - Premium button */}
                            <Link
                                to="/signup"
                                className="flex items-center justify-center gap-2 w-full h-14 rounded-xl border-2 border-white/10 text-white font-medium hover:bg-white/5 hover:border-green-500/50 transition-all duration-300 group"
                            >
                                <Sparkles className="h-5 w-5 text-green-400" />
                                Create an Account
                                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-green-400 group-hover:translate-x-1 transition-all" />
                            </Link>
                        </form>
                    </CardContent>
                </div>
            </Card>
        </div>
    );
}
