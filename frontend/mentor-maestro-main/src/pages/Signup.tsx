import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, User, Mail, Lock } from "lucide-react";

export default function Signup() {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showErrors, setShowErrors] = useState(false);
    const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

    const { signUp } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setShowErrors(true);
        setServerErrors({});

        if (!firstName || !email || !password) {
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

        if (firstName.trim().length < 2) {
            toast.error("First name must be at least 2 characters");
            return;
        }

        setIsLoading(true);
        try {
            const fullName = `${firstName} ${lastName || ""}`.trim();
            const { error } = await signUp(email, password, fullName);
            if (error) throw error;

            toast.success("Registration successful — Welcome aboard!");
            navigate("/setup");
        } catch (error: any) {
            console.error("Signup error:", error);
            const errorMessage = error.message || "Registrering feilet";

            if (errorMessage.toLowerCase().includes("email") || errorMessage.toLowerCase().includes("user with this email")) {
                setServerErrors(prev => ({ ...prev, email: "E-postadressen er allerede registrert" }));
            } else {
                toast.error(errorMessage);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center overflow-hidden py-8">
            {/* Full Screen Background Image */}
            {/* Full Screen Background Image */}
            <div
                className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: 'url("https://devui.change20.no/_next/static/media/change-l-bg.f38691a1.jpg")',
                    filter: 'blur(8px)',
                    transform: 'scale(1.05)',
                }}
            />

            {/* Signup Card - Exact Match */}
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

                    {/* Header - EXACT SAME FONT/WEIGHT */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-semibold text-white mb-2 tracking-tight">Opprett konto</h1>
                        <p className="text-gray-400 text-sm font-normal">Registrer deg for å komme i gang</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* First Name */}
                        <div className="space-y-1.5">
                            <Label htmlFor="firstName" className="text-sm font-normal text-gray-300">
                                Fornavn
                            </Label>
                            <div className="relative">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                                <Input
                                    id="firstName"
                                    type="text"
                                    placeholder="Fornavn"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    // Darker input background, explicit border
                                    className={`pl-11 h-12 bg-[#253630] border-gray-700/50 text-white placeholder:text-gray-500 rounded-lg focus:border-[#7AB93C] focus:ring-1 focus:ring-[#7AB93C] transition-all font-normal ${showErrors && !firstName ? "border-red-500/80 ring-1 ring-red-500/50" : ""}`}
                                />
                            </div>
                            {showErrors && !firstName && (
                                <p className="text-[#EF4444] text-xs font-normal">Dette feltet er obligatorisk</p>
                            )}
                        </div>

                        {/* Last Name */}
                        <div className="space-y-1.5">
                            <Label htmlFor="lastName" className="text-sm font-normal text-gray-300">
                                Etternavn <span className="text-gray-500 text-xs font-normal ml-1">(valgfritt)</span>
                            </Label>
                            <div className="relative">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                                <Input
                                    id="lastName"
                                    type="text"
                                    placeholder="Etternavn"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className={`pl-11 h-12 bg-[#253630] border-gray-700/50 text-white placeholder:text-gray-500 rounded-lg focus:border-[#7AB93C] focus:ring-1 focus:ring-[#7AB93C] transition-all font-normal`}
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-1.5">
                            <Label htmlFor="email" className="text-sm font-normal text-gray-300">
                                E-post
                            </Label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="demo.doe@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={`pl-11 h-12 bg-[#253630] border-gray-700/50 text-white placeholder:text-gray-500 rounded-lg focus:border-[#7AB93C] focus:ring-1 focus:ring-[#7AB93C] transition-all font-normal ${showErrors && !email ? "border-red-500/80 ring-1 ring-red-500/50" : ""}`}
                                />
                            </div>
                            {showErrors && !email && (
                                <p className="text-[#EF4444] text-xs font-normal">Dette feltet er obligatorisk</p>
                            )}
                            {serverErrors.email && (
                                <p className="text-[#EF4444] text-xs font-normal">{serverErrors.email}</p>
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

                        {/* Register Button - LIME GREEN */}
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 text-[#1B2C26] font-bold text-base rounded-full mt-6 hover:opacity-90 transition-opacity"
                            style={{
                                backgroundColor: '#84cc16', // Lime-500 equivalent, matching reference
                            }}
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Behandler...</span>
                                </div>
                            ) : (
                                "Register"
                            )}
                        </Button>

                        {/* Login Link */}
                        <div className="text-center mt-6">
                            <p className="text-sm text-gray-400 font-normal">
                                Har en konto{" "}
                                <Link
                                    to="/login"
                                    className="text-[#84cc16] hover:underline hover:text-[#a3e635] font-normal ml-1"
                                >
                                    Logg på
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
