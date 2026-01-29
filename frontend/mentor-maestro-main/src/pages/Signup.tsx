import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function Signup() {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [country, setCountry] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showErrors, setShowErrors] = useState(false);

    const { signUp } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setShowErrors(true);

        if (!firstName || !lastName || !email || !password) {
            return;
        }

        setIsLoading(true);
        try {
            const fullName = `${firstName} ${lastName}`;
            const { error } = await signUp(email, password, fullName);
            if (error) throw error;

            toast.success("Konto opprettet!");
            navigate("/");
        } catch (error: any) {
            toast.error(error.message || "Registrering feilet");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen h-screen w-full relative flex items-center justify-center lg:justify-end overflow-hidden py-16">
            {/* Background Image */}
            <div
                className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: 'url("https://devui.change20.no/_next/static/media/change-l-bg.f38691a1.jpg")',
                }}
            >
            </div>

            {/* Signup Card */}
            <Card className="z-10 w-full max-w-[650px] bg-[rgb(48,61,54)] border-none text-white shadow-none relative rounded-[10px] lg:mr-24 my-auto">
                <div className="px-[60px] py-[60px]">
                    {/* Logo Section */}
                    <div className="text-center mb-[30px]">
                        <div className="flex justify-center mb-6">
                            <img
                                src="https://demo.devredorange.com/change20/wp-content/uploads/2025/10/CHANGE_logo_Light-240x143.png"
                                alt="Change 2.0"
                                className="w-[130px] h-auto object-contain"
                            />
                        </div>
                        <h1 className="text-[24px] font-bold text-white mb-1">Bli en mentor</h1>
                        <p className="text-gray-300">Del kunnskapen din. Styrk neste generasjon</p>
                    </div>

                    <CardContent className="p-0">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                {/* First Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="firstName" className="text-sm font-medium text-white">
                                        Fornavn
                                    </Label>
                                    <Input
                                        id="firstName"
                                        type="text"
                                        placeholder="Fornavn"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        className={`h-[44px] bg-white text-gray-900 border border-slate-200 rounded-md focus:ring-2 focus:ring-[#096cd0] ${showErrors && !firstName ? "ring-2 ring-red-500" : ""}`}
                                    />
                                    {showErrors && !firstName && (
                                        <p className="text-red-400 text-xs mt-1">Påkrevd</p>
                                    )}
                                </div>
                                {/* Last Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="lastName" className="text-sm font-medium text-white">
                                        Etternavn
                                    </Label>
                                    <Input
                                        id="lastName"
                                        type="text"
                                        placeholder="Etternavn"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        className={`h-[44px] bg-white text-gray-900 border border-slate-200 rounded-md focus:ring-2 focus:ring-[#096cd0] ${showErrors && !lastName ? "ring-2 ring-red-500" : ""}`}
                                    />
                                    {showErrors && !lastName && (
                                        <p className="text-red-400 text-xs mt-1">Påkrevd</p>
                                    )}
                                </div>
                            </div>

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
                                    placeholder="*** *** ****"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={`h-[44px] bg-white text-gray-900 border border-slate-200 rounded-md focus:ring-2 focus:ring-[#096cd0] ${showErrors && !password ? "ring-2 ring-red-500" : ""}`}
                                />
                                {showErrors && !password && (
                                    <p className="text-red-400 text-xs mt-1">Dette feltet er påkrevd</p>
                                )}
                            </div>

                            {/* Country (Visual only for now) */}
                            <div className="space-y-2">
                                <Label htmlFor="country" className="text-sm font-medium text-white">
                                    Land
                                </Label>
                                <div className="relative">
                                    <select
                                        className="flex h-[44px] w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#096cd0] disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 text-gray-900 appearance-none"
                                        value={country}
                                        onChange={(e) => setCountry(e.target.value)}
                                        style={{ backgroundImage: 'none' }} // Remove default arrow if needed or keep standard
                                    >
                                        <option value="" disabled>Velg land</option>
                                        <option value="NO">Norge</option>
                                        <option value="SE">Sverige</option>
                                        <option value="DK">Danmark</option>
                                        <option value="US">United States</option>
                                        <option value="Other">Annet</option>
                                    </select>
                                    {/* Custom arrow if needed, but standard select is safer for zero-dep */}
                                </div>
                            </div>

                            {/* Register Button */}
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-[48px] bg-[#85BF42] hover:bg-[#76aa3b] text-white font-semibold text-[16px] rounded-full shadow-md transition-all duration-300 mt-4"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    "Register"
                                )}
                            </Button>

                            {/* Divider/Login Link */}
                            <div className="text-center mt-6">
                                <p className="text-sm text-white">
                                    Har en konto?{" "}
                                    <Link
                                        to="/login"
                                        className="text-[#85BF42] hover:underline font-medium transition-colors"
                                    >
                                        Logg på
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
