import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, ChevronDown, Search, Zap, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";

// Complete country list with flag URLs from flagcdn.com
const countries = [
    { code: "AF", name: "Afghanistan" },
    { code: "AL", name: "Albania" },
    { code: "DZ", name: "Algeria" },
    { code: "AS", name: "American Samoa" },
    { code: "AD", name: "Andorra" },
    { code: "AO", name: "Angola" },
    { code: "AI", name: "Anguilla" },
    { code: "AQ", name: "Antarctica" },
    { code: "AG", name: "Antigua and Barbuda" },
    { code: "AR", name: "Argentina" },
    { code: "AM", name: "Armenia" },
    { code: "AW", name: "Aruba" },
    { code: "AU", name: "Australia" },
    { code: "AT", name: "Austria" },
    { code: "AZ", name: "Azerbaijan" },
    { code: "BS", name: "Bahamas" },
    { code: "BH", name: "Bahrain" },
    { code: "BD", name: "Bangladesh" },
    { code: "BB", name: "Barbados" },
    { code: "BY", name: "Belarus" },
    { code: "BE", name: "Belgium" },
    { code: "BZ", name: "Belize" },
    { code: "BJ", name: "Benin" },
    { code: "BM", name: "Bermuda" },
    { code: "BT", name: "Bhutan" },
    { code: "BO", name: "Bolivia" },
    { code: "BA", name: "Bosnia and Herzegovina" },
    { code: "BW", name: "Botswana" },
    { code: "BR", name: "Brazil" },
    { code: "BN", name: "Brunei" },
    { code: "BG", name: "Bulgaria" },
    { code: "BF", name: "Burkina Faso" },
    { code: "BI", name: "Burundi" },
    { code: "KH", name: "Cambodia" },
    { code: "CM", name: "Cameroon" },
    { code: "CA", name: "Canada" },
    { code: "CV", name: "Cape Verde" },
    { code: "KY", name: "Cayman Islands" },
    { code: "CF", name: "Central African Republic" },
    { code: "TD", name: "Chad" },
    { code: "CL", name: "Chile" },
    { code: "CN", name: "China" },
    { code: "CO", name: "Colombia" },
    { code: "KM", name: "Comoros" },
    { code: "CG", name: "Congo" },
    { code: "CR", name: "Costa Rica" },
    { code: "HR", name: "Croatia" },
    { code: "CU", name: "Cuba" },
    { code: "CY", name: "Cyprus" },
    { code: "CZ", name: "Czech Republic" },
    { code: "DK", name: "Denmark" },
    { code: "DJ", name: "Djibouti" },
    { code: "DM", name: "Dominica" },
    { code: "DO", name: "Dominican Republic" },
    { code: "EC", name: "Ecuador" },
    { code: "EG", name: "Egypt" },
    { code: "SV", name: "El Salvador" },
    { code: "GQ", name: "Equatorial Guinea" },
    { code: "ER", name: "Eritrea" },
    { code: "EE", name: "Estonia" },
    { code: "ET", name: "Ethiopia" },
    { code: "FJ", name: "Fiji" },
    { code: "FI", name: "Finland" },
    { code: "FR", name: "France" },
    { code: "GA", name: "Gabon" },
    { code: "GM", name: "Gambia" },
    { code: "GE", name: "Georgia" },
    { code: "DE", name: "Germany" },
    { code: "GH", name: "Ghana" },
    { code: "GR", name: "Greece" },
    { code: "GD", name: "Grenada" },
    { code: "GT", name: "Guatemala" },
    { code: "GN", name: "Guinea" },
    { code: "GY", name: "Guyana" },
    { code: "HT", name: "Haiti" },
    { code: "HN", name: "Honduras" },
    { code: "HK", name: "Hong Kong" },
    { code: "HU", name: "Hungary" },
    { code: "IS", name: "Iceland" },
    { code: "IN", name: "India" },
    { code: "ID", name: "Indonesia" },
    { code: "IR", name: "Iran" },
    { code: "IQ", name: "Iraq" },
    { code: "IE", name: "Ireland" },
    { code: "IL", name: "Israel" },
    { code: "IT", name: "Italy" },
    { code: "JM", name: "Jamaica" },
    { code: "JP", name: "Japan" },
    { code: "JO", name: "Jordan" },
    { code: "KZ", name: "Kazakhstan" },
    { code: "KE", name: "Kenya" },
    { code: "KI", name: "Kiribati" },
    { code: "KP", name: "North Korea" },
    { code: "KR", name: "South Korea" },
    { code: "KW", name: "Kuwait" },
    { code: "KG", name: "Kyrgyzstan" },
    { code: "LA", name: "Laos" },
    { code: "LV", name: "Latvia" },
    { code: "LB", name: "Lebanon" },
    { code: "LS", name: "Lesotho" },
    { code: "LR", name: "Liberia" },
    { code: "LY", name: "Libya" },
    { code: "LI", name: "Liechtenstein" },
    { code: "LT", name: "Lithuania" },
    { code: "LU", name: "Luxembourg" },
    { code: "MO", name: "Macau" },
    { code: "MK", name: "Macedonia" },
    { code: "MG", name: "Madagascar" },
    { code: "MW", name: "Malawi" },
    { code: "MY", name: "Malaysia" },
    { code: "MV", name: "Maldives" },
    { code: "ML", name: "Mali" },
    { code: "MT", name: "Malta" },
    { code: "MH", name: "Marshall Islands" },
    { code: "MR", name: "Mauritania" },
    { code: "MU", name: "Mauritius" },
    { code: "MX", name: "Mexico" },
    { code: "FM", name: "Micronesia" },
    { code: "MD", name: "Moldova" },
    { code: "MC", name: "Monaco" },
    { code: "MN", name: "Mongolia" },
    { code: "ME", name: "Montenegro" },
    { code: "MA", name: "Morocco" },
    { code: "MZ", name: "Mozambique" },
    { code: "MM", name: "Myanmar" },
    { code: "NA", name: "Namibia" },
    { code: "NR", name: "Nauru" },
    { code: "NP", name: "Nepal" },
    { code: "NL", name: "Netherlands" },
    { code: "NZ", name: "New Zealand" },
    { code: "NI", name: "Nicaragua" },
    { code: "NE", name: "Niger" },
    { code: "NG", name: "Nigeria" },
    { code: "NO", name: "Norway" },
    { code: "OM", name: "Oman" },
    { code: "PK", name: "Pakistan" },
    { code: "PW", name: "Palau" },
    { code: "PS", name: "Palestine" },
    { code: "PA", name: "Panama" },
    { code: "PG", name: "Papua New Guinea" },
    { code: "PY", name: "Paraguay" },
    { code: "PE", name: "Peru" },
    { code: "PH", name: "Philippines" },
    { code: "PL", name: "Poland" },
    { code: "PT", name: "Portugal" },
    { code: "PR", name: "Puerto Rico" },
    { code: "QA", name: "Qatar" },
    { code: "RO", name: "Romania" },
    { code: "RU", name: "Russia" },
    { code: "RW", name: "Rwanda" },
    { code: "SA", name: "Saudi Arabia" },
    { code: "SN", name: "Senegal" },
    { code: "RS", name: "Serbia" },
    { code: "SC", name: "Seychelles" },
    { code: "SL", name: "Sierra Leone" },
    { code: "SG", name: "Singapore" },
    { code: "SK", name: "Slovakia" },
    { code: "SI", name: "Slovenia" },
    { code: "SB", name: "Solomon Islands" },
    { code: "SO", name: "Somalia" },
    { code: "ZA", name: "South Africa" },
    { code: "SS", name: "South Sudan" },
    { code: "ES", name: "Spain" },
    { code: "LK", name: "Sri Lanka" },
    { code: "SD", name: "Sudan" },
    { code: "SR", name: "Suriname" },
    { code: "SZ", name: "Swaziland" },
    { code: "SE", name: "Sweden" },
    { code: "CH", name: "Switzerland" },
    { code: "SY", name: "Syria" },
    { code: "TW", name: "Taiwan" },
    { code: "TJ", name: "Tajikistan" },
    { code: "TZ", name: "Tanzania" },
    { code: "TH", name: "Thailand" },
    { code: "TL", name: "Timor-Leste" },
    { code: "TG", name: "Togo" },
    { code: "TO", name: "Tonga" },
    { code: "TT", name: "Trinidad and Tobago" },
    { code: "TN", name: "Tunisia" },
    { code: "TR", name: "Turkey" },
    { code: "TM", name: "Turkmenistan" },
    { code: "TV", name: "Tuvalu" },
    { code: "UG", name: "Uganda" },
    { code: "UA", name: "Ukraine" },
    { code: "AE", name: "United Arab Emirates" },
    { code: "GB", name: "United Kingdom" },
    { code: "US", name: "United States" },
    { code: "UY", name: "Uruguay" },
    { code: "UZ", name: "Uzbekistan" },
    { code: "VU", name: "Vanuatu" },
    { code: "VE", name: "Venezuela" },
    { code: "VN", name: "Vietnam" },
    { code: "YE", name: "Yemen" },
    { code: "ZM", name: "Zambia" },
    { code: "ZW", name: "Zimbabwe" },
];

// Get flag URL from flagcdn.com
const getFlagUrl = (code: string) => `https://flagcdn.com/24x18/${code.toLowerCase()}.png`;

// Features to display
const features = [
    "AI-powered webinar generation",
    "Professional email sequences",
    "Slide structure automation",
    "Smart content optimization"
];

export default function Signup() {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        country: "",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [showErrors, setShowErrors] = useState(false);
    const [isCountryOpen, setIsCountryOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const { signUp } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleCountrySelect = (countryCode: string) => {
        setFormData({ ...formData, country: countryCode });
        setIsCountryOpen(false);
        setSearchQuery("");
    };

    const getSelectedCountry = () => {
        return countries.find(c => c.code === formData.country);
    };

    const filteredCountries = countries.filter(country =>
        country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        country.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setShowErrors(true);

        if (!formData.email || !formData.password || !formData.firstName || !formData.lastName || !formData.country) {
            return;
        }

        setIsLoading(true);
        try {
            const fullName = `${formData.firstName} ${formData.lastName}`;
            const { error } = await signUp(formData.email, formData.password, fullName);

            if (error) throw error;

            toast.success("Account created successfully!");
            navigate("/login");
        } catch (error: any) {
            toast.error(error.message || "Registration failed");
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

            {/* Features panel - Desktop only */}
            <div className="hidden xl:block fixed left-20 top-1/2 -translate-y-1/2 z-10">
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 max-w-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30">
                            <Zap className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Change 2.0</h2>
                            <p className="text-sm text-white/70">Mentor Platform</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {features.map((feature, index) => (
                            <div key={index} className="flex items-center gap-3 text-white/90">
                                <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                                <span className="text-sm">{feature}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Signup Card - Premium glassmorphism */}
            <Card className="z-10 w-full max-w-[500px] bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl border border-white/10 text-white shadow-2xl relative rounded-3xl lg:mr-20 max-h-[95vh] overflow-y-auto">
                {/* Card glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-purple-500/5 rounded-3xl" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-500/50 to-transparent" />

                <div className="relative p-8 md:p-10">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-4">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl blur-xl opacity-50 animate-pulse" />
                                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg shadow-green-500/30">
                                    <Sparkles className="h-8 w-8 text-white" />
                                </div>
                            </div>
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">Become a Mentor</h1>
                        <p className="text-gray-400">Share your knowledge. Empower the next generation.</p>
                    </div>

                    <CardContent className="p-0">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Name Row */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* First Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="firstName" className="text-sm font-medium text-gray-300">
                                        First Name
                                    </Label>
                                    <div className="relative group">
                                        <Input
                                            id="firstName"
                                            placeholder="John"
                                            value={formData.firstName}
                                            onChange={handleChange}
                                            className={`h-12 bg-white/5 text-white border-2 ${showErrors && !formData.firstName ? "border-red-500" : "border-white/10"
                                                } focus:border-green-500 focus:ring-2 focus:ring-green-500/20 rounded-xl placeholder:text-gray-500 transition-all duration-300`}
                                        />
                                    </div>
                                    {showErrors && !formData.firstName && (
                                        <p className="text-xs text-red-400 font-medium">Required</p>
                                    )}
                                </div>

                                {/* Last Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="lastName" className="text-sm font-medium text-gray-300">
                                        Last Name
                                    </Label>
                                    <div className="relative group">
                                        <Input
                                            id="lastName"
                                            placeholder="Doe"
                                            value={formData.lastName}
                                            onChange={handleChange}
                                            className={`h-12 bg-white/5 text-white border-2 ${showErrors && !formData.lastName ? "border-red-500" : "border-white/10"
                                                } focus:border-green-500 focus:ring-2 focus:ring-green-500/20 rounded-xl placeholder:text-gray-500 transition-all duration-300`}
                                        />
                                    </div>
                                    {showErrors && !formData.lastName && (
                                        <p className="text-xs text-red-400 font-medium">Required</p>
                                    )}
                                </div>
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium text-gray-300">
                                    Email Address
                                </Label>
                                <div className="relative group">
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="john@example.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className={`h-12 bg-white/5 text-white border-2 ${showErrors && !formData.email ? "border-red-500" : "border-white/10"
                                            } focus:border-green-500 focus:ring-2 focus:ring-green-500/20 rounded-xl placeholder:text-gray-500 transition-all duration-300`}
                                    />
                                </div>
                                {showErrors && !formData.email && (
                                    <p className="text-xs text-red-400 font-medium">Email is required</p>
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
                                        value={formData.password}
                                        onChange={handleChange}
                                        className={`h-12 bg-white/5 text-white border-2 ${showErrors && !formData.password ? "border-red-500" : "border-white/10"
                                            } focus:border-green-500 focus:ring-2 focus:ring-green-500/20 rounded-xl placeholder:text-gray-500 transition-all duration-300`}
                                    />
                                </div>
                                {showErrors && !formData.password && (
                                    <p className="text-xs text-red-400 font-medium">Password is required</p>
                                )}
                            </div>

                            {/* Country Dropdown - Premium style */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-300">Country</Label>
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setIsCountryOpen(!isCountryOpen)}
                                        className={`w-full h-12 bg-white/5 text-white border-2 ${showErrors && !formData.country ? "border-red-500" : "border-white/10"
                                            } rounded-xl px-4 flex items-center justify-between hover:border-white/20 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-300`}
                                    >
                                        <span className={formData.country ? "text-white flex items-center gap-3" : "text-gray-500"}>
                                            {getSelectedCountry() ? (
                                                <>
                                                    <img
                                                        src={getFlagUrl(getSelectedCountry()!.code)}
                                                        alt={getSelectedCountry()!.name}
                                                        className="w-6 h-4 object-cover rounded-sm"
                                                    />
                                                    {getSelectedCountry()?.name}
                                                </>
                                            ) : (
                                                "Select your country"
                                            )}
                                        </span>
                                        <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform duration-300 ${isCountryOpen ? "rotate-180" : ""}`} />
                                    </button>

                                    {isCountryOpen && (
                                        <div className="absolute z-50 w-full mt-2 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                                            {/* Search Input */}
                                            <div className="p-3 border-b border-white/10">
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        placeholder="Search country..."
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                        className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-green-500 transition-colors"
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </div>
                                            </div>
                                            {/* Country List */}
                                            <div className="max-h-48 overflow-y-auto">
                                                {filteredCountries.map((country) => (
                                                    <button
                                                        key={country.code}
                                                        type="button"
                                                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/10 text-white text-left transition-colors"
                                                        onClick={() => handleCountrySelect(country.code)}
                                                    >
                                                        <img
                                                            src={getFlagUrl(country.code)}
                                                            alt={country.name}
                                                            className="w-6 h-4 object-cover rounded-sm"
                                                        />
                                                        <span>{country.name}</span>
                                                    </button>
                                                ))}
                                                {filteredCountries.length === 0 && (
                                                    <div className="px-4 py-3 text-gray-500 text-center">
                                                        No countries found
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {showErrors && !formData.country && (
                                    <p className="text-xs text-red-400 font-medium">Please select a country</p>
                                )}
                            </div>

                            {/* Register Button - Premium with glow */}
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="relative w-full h-14 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-bold text-lg rounded-xl shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] mt-6 overflow-hidden group"
                            >
                                {/* Button glow animation */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

                                {isLoading ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    <span className="flex items-center justify-center gap-2 relative z-10">
                                        Create Account
                                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                    </span>
                                )}
                            </Button>

                            {/* Login Link */}
                            <div className="text-center mt-6">
                                <p className="text-sm text-gray-400">
                                    Already have an account?{" "}
                                    <Link
                                        to="/login"
                                        className="font-medium text-green-400 hover:text-green-300 transition-colors"
                                    >
                                        Sign In
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
