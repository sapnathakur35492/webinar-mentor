import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, User, Mail } from "lucide-react";

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

        setIsLoading(true);
        try {
            const { error } = await signIn(email, password);
            if (error) throw error;

            navigate("/");
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
                className="fixed inset-0 z-0"
                style={{
                    backgroundImage: 'url("https://devui.change20.no/_next/static/media/change-l-bg.f38691a1.jpg")',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                }}
            />

            {/* Login Card - Bigger Size */}
            <div className="relative z-10 w-full max-w-[500px] mx-4">
                <div
                    className="rounded-2xl p-10 md:p-12"
                    style={{
                        background: 'linear-gradient(180deg, rgba(27, 45, 39, 0.92), rgba(19, 32, 28, 0.95))',
                        backdropFilter: 'blur(24px)',
                        WebkitBackdropFilter: 'blur(24px)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
                    }}
                >
                    {/* Logo */}
                    <div className="flex justify-center mb-8">
                        <img
                            src="/logo.png"
                            alt="Change 2.0"
                            className="h-24"
                        />
                    </div>

                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2 italic">logge inn</h1>
                        <p className="text-gray-400 text-sm">Logg inn for å fortsette til din konto</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium text-white">
                                E-post
                            </Label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="demo.doe@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={`pl-12 h-14 bg-white/5 border border-white/10 text-white placeholder:text-gray-500 rounded-xl focus:border-[#3bba69] focus:ring-1 focus:ring-[#3bba69] transition-all ${showErrors && !email ? "border-red-500 ring-1 ring-red-500" : ""}`}
                                />
                            </div>
                            {showErrors && !email && (
                                <p className="text-red-500 text-xs">Dette feltet er obligatorisk</p>
                            )}
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-sm font-medium text-white">
                                Passord
                            </Label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="*** *** ****"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={`pl-12 h-14 bg-white/5 border border-white/10 text-white placeholder:text-gray-500 rounded-xl focus:border-[#3bba69] focus:ring-1 focus:ring-[#3bba69] transition-all ${showErrors && !password ? "border-red-500 ring-1 ring-red-500" : ""}`}
                                />
                            </div>
                            {showErrors && !password && (
                                <p className="text-red-500 text-xs">Dette feltet er obligatorisk</p>
                            )}
                        </div>

                        {/* Forgot Password Link */}
                        <div className="text-right">
                            <Link
                                to="/forgot-password"
                                className="text-sm text-gray-400 hover:text-white transition-colors"
                            >
                                glemt passord
                            </Link>
                        </div>

                        {/* Login Button */}
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-14 text-white font-semibold text-base rounded-full shadow-lg transition-all duration-300 hover:opacity-90"
                            style={{
                                background: 'linear-gradient(135deg, #3bba69, #279b65)',
                            }}
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                "Logg inn"
                            )}
                        </Button>

                        {/* Register Link */}
                        <div className="text-center mt-6">
                            <p className="text-sm text-gray-400">
                                Har en konto?{" "}
                                <Link
                                    to="/signup"
                                    className="text-[#3bba69] hover:underline font-medium"
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
