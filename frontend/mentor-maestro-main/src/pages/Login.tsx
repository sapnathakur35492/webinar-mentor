import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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
            // toast.error("Vennligst fyll ut alle felt"); // Removed as per request
            return;
        }

        setIsLoading(true);
        try {
            const { error } = await signIn(email, password);
            if (error) throw error;

            toast.success("Velkommen tilbake!");
            navigate("/");
        } catch (error: any) {
            toast.error(error.message || "Innlogging feilet");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen h-screen w-full relative flex items-center justify-center lg:justify-end overflow-hidden">
            {/* Background Image - Exact match */}
            <div
                className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: 'url("https://devui.change20.no/_next/static/media/change-l-bg.f38691a1.jpg")',
                }}
            >
                {/* No overlay needed as per reference site */}
            </div>

            {/* Login Card */}
            <Card className="z-10 w-full max-w-[650px] bg-[rgb(48,61,54)] border-none text-white shadow-none relative rounded-[10px] lg:mr-24 my-auto">
                <div className="px-[60px] py-[60px]">
                    {/* Logo Section */}
                    <div className="text-center mb-[40px]">
                        <div className="flex justify-center mb-6">
                            <img
                                src="https://demo.devredorange.com/change20/wp-content/uploads/2025/10/CHANGE_logo_Light-240x143.png"
                                alt="Change 2.0"
                                className="w-[130px] h-auto object-contain"
                            />
                        </div>
                        <h1 className="text-[24px] font-bold text-white mb-2">Logg inn som mentor</h1>
                    </div>

                    <CardContent className="p-0">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Email */}
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium text-white">
                                    E-post
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="demo.doe@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={`h-[44px] bg-white text-gray-900 border border-slate-200 rounded-md focus:ring-2 focus:ring-[#096cd0] ${showErrors && !email ? "ring-2 ring-red-500" : ""}`}
                                />
                                {showErrors && !email && (
                                    <p className="text-red-400 text-xs mt-1">Dette feltet er påkrevd</p>
                                )}
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-sm font-medium text-white">
                                    Passord
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="*********"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={`h-[44px] bg-white text-gray-900 border border-slate-200 rounded-md focus:ring-2 focus:ring-[#096cd0] ${showErrors && !password ? "ring-2 ring-red-500" : ""}`}
                                />
                                {showErrors && !password && (
                                    <p className="text-red-400 text-xs mt-1">Dette feltet er påkrevd</p>
                                )}
                            </div>

                            {/* Forgot Password Link */}
                            <div className="flex justify-end">
                                <a href="#" className="text-sm text-white hover:underline transition-colors">
                                    glemt passord
                                </a>
                            </div>

                            {/* Login Button */}
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-[48px] bg-[#85BF42] hover:bg-[#76aa3b] text-white font-semibold text-[16px] rounded-full shadow-md transition-all duration-300 mt-3"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    "Logg inn"
                                )}
                            </Button>

                            {/* Signup Link */}
                            <div className="text-center mt-6">
                                <p className="text-sm text-white">
                                    Har ikke en konto?{" "}
                                    <Link
                                        to="/signup"
                                        className="text-[#85BF42] hover:underline font-medium transition-colors"
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
