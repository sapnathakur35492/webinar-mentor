import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, User, Lock } from "lucide-react";

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
            return;
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            toast.error("Please enter a valid email address");
            return;
        }

        if (password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        setIsLoading(true);
        try {
            const { error } = await signIn(email, password);
            if (error) throw error;

            navigate("/setup");
        } catch (error: any) {
            toast.error(error.message || "Innlogging feilet");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center overflow-hidden">
            {/* Full Screen Background Image */}
            <div
                className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: 'url("https://devui.change20.no/_next/static/media/change-l-bg.f38691a1.jpg")',
                    filter: 'blur(8px)',
                    transform: 'scale(1.05)',
                }}
            />

            {/* Login Card - Exact Match */}
            <div className="relative z-10 w-full max-w-[500px] mx-4 animate-fade-in-up">
                <div
                    className="rounded-xl p-8 md:p-10"
                    style={{
                        backgroundColor: '#1B2C26', // Exact dark green/black from reference
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
                        border: 'none',
                    }}
                >
                    {/* Logo */}
                    <div className="flex justify-center mb-6">
                        <img
                            src="/logo.png"
                            alt="Change 2.0"
                            className="h-20"
                        />
                    </div>

                    {/* Header */}
                    <div className="text-center mb-8">
                        {/* NO ITALIC, Standard Font */}
                        <h1 className="text-3xl font-semibold text-white mb-2 tracking-tight">logge inn</h1>
                        <p className="text-gray-400 text-sm font-normal">Logg inn for å fortsette til din konto</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email */}
                        <div className="space-y-1.5">
                            <Label htmlFor="email" className="text-sm font-normal text-gray-300">
                                E-post
                            </Label>
                            <div className="relative">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="demo.doe@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    // Darker input background, explicit border
                                    className={`pl-11 h-12 bg-[#253630] border-gray-700/50 text-white placeholder:text-gray-500 rounded-lg focus:border-[#7AB93C] focus:ring-1 focus:ring-[#7AB93C] transition-all font-normal ${showErrors && !email ? "border-red-500/80 ring-1 ring-red-500/50" : ""}`}
                                />
                            </div>
                            {showErrors && !email && (
                                <p className="text-[#EF4444] text-xs font-normal">Dette feltet er obligatorisk</p>
                            )}
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <Label htmlFor="password" className="text-sm font-normal text-gray-300">
                                Passord
                            </Label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="*** *** ****"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={`pl-11 h-12 bg-[#253630] border-gray-700/50 text-white placeholder:text-gray-500 rounded-lg focus:border-[#7AB93C] focus:ring-1 focus:ring-[#7AB93C] transition-all font-normal ${showErrors && !password ? "border-red-500/80 ring-1 ring-red-500/50" : ""}`}
                                />
                            </div>
                            {showErrors && !password && (
                                <p className="text-[#EF4444] text-xs font-normal">Dette feltet er obligatorisk</p>
                            )}
                        </div>

                        {/* Forgot Password Link */}
                        <div className="text-right">
                            <a
                                href="https://devui.change20.no/"
                                className="text-sm text-gray-400 hover:text-white transition-colors font-normal"
                            >
                                glemt passord
                            </a>
                        </div>

                        {/* Login Button - LIME GREEN */}
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 text-[#1B2C26] font-bold text-base rounded-full mt-4 hover:opacity-90 transition-opacity"
                            style={{
                                backgroundColor: '#84cc16', // Lime-500 equivalent
                            }}
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Logg inn...</span>
                                </div>
                            ) : (
                                "Logg inn"
                            )}
                        </Button>

                        {/* Register Link */}
                        <div className="text-center mt-6">
                            <p className="text-sm text-gray-400 font-normal">
                                Har en konto?{" "}
                                <Link
                                    to="/signup"
                                    className="text-[#84cc16] hover:underline hover:text-[#a3e635] font-normal ml-1"
                                >
                                    Registrer deg
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
