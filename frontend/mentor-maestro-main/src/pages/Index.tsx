import { MainLayout } from "@/components/layout/MainLayout";
import { useProfile, PipelineStage } from "@/hooks/useProfile";
import { useDocuments } from "@/hooks/useDocuments";
import { useWebinarConcepts } from "@/hooks/useWebinarConcepts";
import { useEmailSequences } from "@/hooks/useEmailSequences";
import {
  FileText,
  Lightbulb,
  Layout,
  Mail,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Zap,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

// Pipeline stages matching reference design
const pipelineStages: { id: PipelineStage; label: string; icon: typeof FileText; color: string }[] = [
  { id: "onboarding", label: "Onboarding", icon: FileText, color: "blue" },
  { id: "concept_generation", label: "Concept Gen", icon: Lightbulb, color: "amber" },
  { id: "concept_review", label: "Review", icon: CheckCircle2, color: "green" },
  { id: "structure_development", label: "Structure", icon: Layout, color: "purple" },
  { id: "structure_review", label: "Review", icon: CheckCircle2, color: "green" },
  { id: "email_sequence", label: "Emails", icon: Mail, color: "pink" },
  { id: "production", label: "Production", icon: Sparkles, color: "emerald" },
];

const Index = () => {
  const { profile, isLoading: profileLoading } = useProfile();
  const { documents } = useDocuments();
  const { concepts, latestConcept } = useWebinarConcepts();
  const { sequences } = useEmailSequences();

  const currentStageIndex = pipelineStages.findIndex(s => s.id === profile?.current_stage);

  if (profileLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full blur-xl opacity-50 animate-pulse" />
              <div className="relative h-16 w-16 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-white animate-spin" style={{ animationDuration: '2s' }} />
              </div>
            </div>
            <div className="text-gray-500 font-medium animate-pulse">Loading your dashboard...</div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Welcome Header - Premium with gradient text */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8 text-white shadow-2xl">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-green-500/30 to-emerald-500/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">👋</span>
                <p className="text-green-400 text-sm font-semibold uppercase tracking-wider">
                  Welcome back
                </p>
              </div>
              <h1 className="text-4xl font-bold text-white mb-2">
                {profile?.full_name?.split(' ')[0] || "Mentor"}!
              </h1>
              <p className="text-gray-400 text-lg max-w-xl">
                Your AI-powered webinar factory is ready. Let's create something amazing today.
              </p>

              <Link
                to="/concepts"
                className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all duration-300 hover:scale-105"
              >
                <Zap className="h-5 w-5" />
                Generate Webinar Concept
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Stats summary */}
            <div className="hidden lg:flex items-center gap-6">
              <div className="text-center p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
                <div className="flex items-center justify-center h-12 w-12 mx-auto rounded-xl bg-blue-500/20 mb-2">
                  <TrendingUp className="h-6 w-6 text-blue-400" />
                </div>
                <p className="text-2xl font-bold text-white">{documents.length}</p>
                <p className="text-xs text-gray-400">Documents</p>
              </div>
              <div className="text-center p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
                <div className="flex items-center justify-center h-12 w-12 mx-auto rounded-xl bg-amber-500/20 mb-2">
                  <Lightbulb className="h-6 w-6 text-amber-400" />
                </div>
                <p className="text-2xl font-bold text-white">{concepts.length || 0}</p>
                <p className="text-xs text-gray-400">Concepts</p>
              </div>
              <div className="text-center p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
                <div className="flex items-center justify-center h-12 w-12 mx-auto rounded-xl bg-emerald-500/20 mb-2">
                  <Mail className="h-6 w-6 text-emerald-400" />
                </div>
                <p className="text-2xl font-bold text-white">{sequences.length || 0}</p>
                <p className="text-xs text-gray-400">Emails</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pipeline Progress - Modern horizontal timeline */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg shadow-gray-200/50">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Your Pipeline Progress
              </h2>
              <p className="text-sm text-gray-500 mt-1">Track your webinar production journey</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100">
              <Clock className="h-4 w-4 text-green-600" />
              <span className="text-sm font-semibold text-green-700">
                Step {currentStageIndex + 1} of {pipelineStages.length}
              </span>
            </div>
          </div>

          <div className="relative">
            {/* Progress line background */}
            <div className="absolute top-6 left-0 right-0 h-1 bg-gray-100 rounded-full" />
            {/* Progress line fill */}
            <div
              className="absolute top-6 left-0 h-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-700 shadow-lg shadow-green-500/50"
              style={{ width: `${(currentStageIndex / (pipelineStages.length - 1)) * 100}%` }}
            />

            <div className="relative flex items-start justify-between">
              {pipelineStages.map((stage, index) => {
                const Icon = stage.icon;
                const isCompleted = index < currentStageIndex;
                const isCurrent = index === currentStageIndex;
                const isPending = index > currentStageIndex;

                return (
                  <div
                    key={stage.id}
                    className="flex flex-col items-center"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className={cn(
                      "relative flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-500 mb-3 z-10",
                      isCompleted && "bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-lg shadow-green-500/30",
                      isCurrent && "bg-white border-2 border-green-500 text-green-500 shadow-lg shadow-green-500/20 animate-pulse",
                      isPending && "bg-gray-50 text-gray-300 border border-gray-100"
                    )}>
                      {isCompleted ? (
                        <CheckCircle2 className="h-6 w-6" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}

                      {/* Glow effect for current stage */}
                      {isCurrent && (
                        <div className="absolute inset-0 bg-green-500/20 rounded-xl blur-xl animate-pulse" />
                      )}
                    </div>
                    <p className={cn(
                      "text-xs font-medium text-center max-w-[80px] transition-colors duration-300",
                      isCompleted && "text-green-600",
                      isCurrent && "text-green-600 font-semibold",
                      isPending && "text-gray-400"
                    )}>
                      {stage.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick Actions Grid - Premium cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Documents Card */}
          <Link
            to="/setup"
            className="group relative overflow-hidden rounded-2xl bg-white p-6 border border-gray-100 hover:border-blue-200 shadow-lg shadow-gray-200/50 hover:shadow-blue-100/50 transition-all duration-300 hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full blur-2xl opacity-50 translate-x-10 -translate-y-10 group-hover:opacity-80 transition-opacity" />

            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-3 shadow-lg shadow-blue-500/30">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-300" />
              </div>
              <h3 className="font-semibold text-gray-900 text-lg">Documents</h3>
              <p className="text-sm text-gray-500 mt-1">Profile & uploads</p>
              <p className="text-3xl font-bold text-gray-900 mt-4">
                {documents.length}
              </p>
            </div>
          </Link>

          {/* Webinar Concept Card */}
          <Link
            to="/concepts"
            className="group relative overflow-hidden rounded-2xl bg-white p-6 border border-gray-100 hover:border-amber-200 shadow-lg shadow-gray-200/50 hover:shadow-amber-100/50 transition-all duration-300 hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-100 to-amber-50 rounded-full blur-2xl opacity-50 translate-x-10 -translate-y-10 group-hover:opacity-80 transition-opacity" />

            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 p-3 shadow-lg shadow-amber-500/30">
                  <Lightbulb className="h-6 w-6 text-white" />
                </div>
                <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all duration-300" />
              </div>
              <h3 className="font-semibold text-gray-900 text-lg">Webinar Concept</h3>
              <p className="text-sm text-gray-500 mt-1">AI-generated ideas</p>
              <p className="text-3xl font-bold text-gray-900 mt-4">
                {concepts.length || "—"}
              </p>
            </div>
          </Link>

          {/* Slide Structure Card */}
          <Link
            to="/structure"
            className="group relative overflow-hidden rounded-2xl bg-white p-6 border border-gray-100 hover:border-purple-200 shadow-lg shadow-gray-200/50 hover:shadow-purple-100/50 transition-all duration-300 hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-100 to-purple-50 rounded-full blur-2xl opacity-50 translate-x-10 -translate-y-10 group-hover:opacity-80 transition-opacity" />

            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 p-3 shadow-lg shadow-purple-500/30">
                  <Layout className="h-6 w-6 text-white" />
                </div>
                <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-purple-500 group-hover:translate-x-1 transition-all duration-300" />
              </div>
              <h3 className="font-semibold text-gray-900 text-lg">Slide Structure</h3>
              <p className="text-sm text-gray-500 mt-1">Presentation outline</p>
              <p className="text-3xl font-bold text-gray-900 mt-4">
                —
              </p>
            </div>
          </Link>

          {/* Email Sequences Card */}
          <Link
            to="/emails"
            className="group relative overflow-hidden rounded-2xl bg-white p-6 border border-gray-100 hover:border-emerald-200 shadow-lg shadow-gray-200/50 hover:shadow-emerald-100/50 transition-all duration-300 hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-full blur-2xl opacity-50 translate-x-10 -translate-y-10 group-hover:opacity-80 transition-opacity" />

            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 p-3 shadow-lg shadow-emerald-500/30">
                  <Mail className="h-6 w-6 text-white" />
                </div>
                <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all duration-300" />
              </div>
              <h3 className="font-semibold text-gray-900 text-lg">Email Sequences</h3>
              <p className="text-sm text-gray-500 mt-1">Automated campaigns</p>
              <p className="text-3xl font-bold text-gray-900 mt-4">
                {sequences.length || 0}
              </p>
            </div>
          </Link>
        </div>

        {/* Dynamic Next Step Card */}
        {(() => {
          // Dynamic next step configuration based on current stage
          const nextStepConfig: Record<string, {
            title: string;
            description: string;
            action: string;
            link: string;
            color: string;
            bgColor: string;
            emoji: string;
          }> = {
            onboarding: {
              title: "Complete Your Profile",
              description: "Fill in your mentor details and upload documents. The more information you provide, the better AI-generated content you'll receive!",
              action: "Go to Setup",
              link: "/setup",
              color: "text-blue-600",
              bgColor: "from-blue-50 via-indigo-50 to-blue-50",
              emoji: "📋"
            },
            concept_generation: {
              title: "Generate Webinar Concepts",
              description: "Let AI create compelling webinar ideas based on your expertise. Choose from 3 unique concepts tailored to your audience.",
              action: "Create Concepts",
              link: "/concepts",
              color: "text-amber-600",
              bgColor: "from-amber-50 via-orange-50 to-amber-50",
              emoji: "💡"
            },
            concept_review: {
              title: "Review & Approve Concept",
              description: "Review your AI-generated concepts, request refinements if needed, and approve your favorite for the next phase.",
              action: "Review Concepts",
              link: "/concepts",
              color: "text-green-600",
              bgColor: "from-green-50 via-emerald-50 to-green-50",
              emoji: "✅"
            },
            structure_development: {
              title: "Build Slide Structure",
              description: "Your approved concept is ready! Now generate a detailed slide structure for your webinar presentation.",
              action: "Create Structure",
              link: "/structure",
              color: "text-purple-600",
              bgColor: "from-purple-50 via-violet-50 to-purple-50",
              emoji: "🏗️"
            },
            structure_review: {
              title: "Review Slide Structure",
              description: "Review your presentation outline, make adjustments, and approve it before moving to email sequences.",
              action: "Review Structure",
              link: "/structure",
              color: "text-indigo-600",
              bgColor: "from-indigo-50 via-blue-50 to-indigo-50",
              emoji: "📊"
            },
            email_sequence: {
              title: "Create Email Sequences",
              description: "Generate automated email campaigns for registration, reminders, and follow-up to maximize attendance.",
              action: "Generate Emails",
              link: "/emails",
              color: "text-pink-600",
              bgColor: "from-pink-50 via-rose-50 to-pink-50",
              emoji: "✉️"
            },
            production: {
              title: "Finalize & Submit for Approval",
              description: "All content is ready! Submit everything for admin approval to prepare for your webinar launch.",
              action: "Go to Approvals",
              link: "/approvals",
              color: "text-emerald-600",
              bgColor: "from-emerald-50 via-teal-50 to-emerald-50",
              emoji: "🎬"
            },
            launch_ready: {
              title: "You're All Set! 🎉",
              description: "Congratulations! Your webinar content is approved and ready to launch. Time to share it with your audience!",
              action: "View Dashboard",
              link: "/",
              color: "text-green-600",
              bgColor: "from-green-50 via-emerald-50 to-teal-50",
              emoji: "🚀"
            }
          };

          const currentStep = nextStepConfig[profile?.current_stage || "onboarding"] || nextStepConfig.onboarding;

          return (
            <div className={cn("bg-gradient-to-r rounded-2xl p-6 border border-gray-200 shadow-lg relative overflow-hidden", currentStep.bgColor)}>
              {/* Decorative background element */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

              <div className="flex items-start gap-4 relative z-10">
                <div className={cn("flex items-center justify-center h-14 w-14 rounded-2xl bg-white shadow-lg shrink-0")}>
                  <span className="text-3xl">{currentStep.emoji}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className={cn("h-4 w-4", currentStep.color)} />
                    <span className={cn("text-xs font-semibold uppercase tracking-wider", currentStep.color)}>Next Step</span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg">{currentStep.title}</h3>
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                    {currentStep.description}
                  </p>
                </div>
                <Link
                  to={currentStep.link}
                  className={cn(
                    "hidden md:flex items-center gap-2 px-5 py-3 rounded-xl bg-white font-semibold shadow-md hover:shadow-lg transition-all hover:scale-105 shrink-0",
                    currentStep.color
                  )}
                >
                  {currentStep.action}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Mobile action button */}
              <Link
                to={currentStep.link}
                className={cn(
                  "md:hidden mt-4 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white font-semibold shadow-md hover:shadow-lg transition-all w-full",
                  currentStep.color
                )}
              >
                {currentStep.action}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          );
        })()}
      </div>
    </MainLayout>
  );
};

export default Index;
