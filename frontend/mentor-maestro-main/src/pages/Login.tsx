import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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

        setIsLoading(true);
        try {
            const { error } = await signIn(email, password);
            if (error) throw error;

            toast.success("Logget inn!");
            navigate("/");
        } catch (error: any) {
            toast.error(error.message || "Innlogging feilet");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full relative flex items-center justify-center py-8">
            {/* Background Image */}
            <div
                className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: 'url("https://devui.change20.no/_next/static/media/change-l-bg.f38691a1.jpg")',
                }}
            />

            {/* Login Card */}
            <Card className="z-10 w-full max-w-[500px] glass-card animate-fade-in font-poppins text-white rounded-xl mx-4">
                <div className="px-10 py-10">
                    {/* Logo */}
                    <div className="flex justify-center mb-6">
                        <img
                            src="/logo.png"
                            alt="Change 2.0"
                            className="h-16"
                        />
                    </div>

                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-white mb-2">logge inn</h1>
                        <p className="text-gray-400 text-sm">Logg inn for å fortsette til din konto</p>
                    </div>

                    <CardContent className="p-0">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Email */}
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium text-white">
                                    E-post
                                </Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="demo.doe@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className={`pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground rounded-lg focus:border-primary focus:ring-1 focus:ring-primary transition-colors ${showErrors && !email ? "border-destructive ring-1 ring-destructive" : ""}`}
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
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="*** *** ****"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className={`pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground rounded-lg focus:border-primary focus:ring-1 focus:ring-primary transition-colors ${showErrors && !password ? "border-destructive ring-1 ring-destructive" : ""}`}
                                    />
                                </div>
                                {showErrors && !password && (
                                    <p className="text-destructive text-xs">Dette feltet er obligatorisk</p>
                                )}
                            </div>

                            {/* Forgot Password Link */}
                            <div className="text-right">
                                <Link
                                    to="/forgot-password"
                                    className="text-sm text-gray-300 hover:text-white transition-colors"
                                >
                                    glemt passord
                                </Link>
                            </div>

                            {/* Login Button */}
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base rounded-full shadow-lg transition-all duration-300"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    "Logg inn"
                                )}
                            </Button>

                            {/* Register Link */}
                            <div className="text-center mt-6">
                                <p className="text-sm text-gray-300">
                                    Har en konto?{" "}
                                    <Link
                                        to="/signup"
                                        className="text-primary hover:underline font-medium"
                                    >
                                        Registrer deg
                                    </Link>
                                </p>
                            </div>
                        </form>
                    </CardContent>
                </div>
            </Card>
        </div>
    );
}
