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
        {/* Welcome Header - Dark Theme matching reference */}
        <div className="relative overflow-hidden rounded-xl p-6" style={{ backgroundColor: '#142721' }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-[#3bba69] text-xs font-semibold uppercase tracking-wider">
                  Welcome back
                </p>
              </div>
              <h1 className="text-2xl font-bold text-white mb-1">
                {profile?.full_name?.split(' ')[0] || "Mentor"}!
              </h1>
              <p className="text-white/60 text-sm max-w-md">
                Your AI-powered webinar factory is ready. Let's create something amazing today.
              </p>

              <Link
                to="/concepts"
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white font-medium text-sm transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #3bba69, #279b65)' }}
              >
                <Zap className="h-4 w-4" />
                Generate Webinar Concept
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Stats summary - Matching reference exactly */}
            <div className="hidden lg:flex items-center gap-4">
              {/* Documents Stat */}
              <div className="p-4 rounded-lg border border-white/10" style={{ backgroundColor: '#0d1f1a' }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-6 w-6 rounded bg-blue-500/20 flex items-center justify-center">
                    <TrendingUp className="h-3.5 w-3.5 text-blue-400" />
                  </div>
                  <span className="text-white/60 text-xs">Documents</span>
                </div>
                <div className="flex items-end gap-3">
                  <p className="text-xl font-bold text-white">{documents.length}</p>
                  {/* Mini Bar Chart */}
                  <div className="flex items-end gap-0.5 pb-1">
                    {[3, 5, 2, 6, 4, 7, 5].map((h, i) => (
                      <div key={i} className="w-1" style={{ height: `${h * 2}px`, backgroundColor: i % 2 === 0 ? '#3bba69' : '#fbbf24' }} />
                    ))}
                  </div>
                </div>
              </div>
              {/* Concepts Stat */}
              <div className="p-4 rounded-lg border border-white/10" style={{ backgroundColor: '#0d1f1a' }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-6 w-6 rounded bg-amber-500/20 flex items-center justify-center">
                    <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
                  </div>
                  <span className="text-white/60 text-xs">Concepts</span>
                </div>
                <div className="flex items-end gap-3">
                  <p className="text-xl font-bold text-white">{concepts.length || 0}</p>
                  <div className="flex items-end gap-0.5 pb-1">
                    {[4, 6, 3, 5, 7, 4, 6].map((h, i) => (
                      <div key={i} className="w-1" style={{ height: `${h * 2}px`, backgroundColor: i % 2 === 0 ? '#3bba69' : '#fbbf24' }} />
                    ))}
                  </div>
                </div>
              </div>
              {/* Emails Stat */}
              <div className="p-4 rounded-lg border border-white/10" style={{ backgroundColor: '#0d1f1a' }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-6 w-6 rounded bg-emerald-500/20 flex items-center justify-center">
                    <Mail className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                  <span className="text-white/60 text-xs">Emails</span>
                </div>
                <div className="flex items-end gap-3">
                  <p className="text-xl font-bold text-white">{sequences.length || 0}</p>
                  <div className="flex items-end gap-0.5 pb-1">
                    {[5, 3, 6, 4, 7, 5, 3].map((h, i) => (
                      <div key={i} className="w-1" style={{ height: `${h * 2}px`, backgroundColor: i % 2 === 0 ? '#3bba69' : '#fbbf24' }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pipeline Progress - Dark Theme matching reference */}
        <div className="rounded-xl p-5 border border-white/10" style={{ backgroundColor: '#142721' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white">
                Your Pipeline Progress
              </h2>
              <p className="text-xs text-white/50 mt-0.5">Track your webinar production journey</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(59, 186, 105, 0.15)' }}>
              <Clock className="h-3.5 w-3.5 text-[#3bba69]" />
              <span className="text-xs font-medium text-[#3bba69]">
                Step {currentStageIndex + 1} of {pipelineStages.length}
              </span>
            </div>
          </div>

          <div className="relative">
            {/* Progress line background */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-white/10 rounded-full" />
            {/* Progress line fill */}
            <div
              className="absolute top-5 left-0 h-0.5 rounded-full transition-all duration-700"
              style={{
                width: `${(currentStageIndex / (pipelineStages.length - 1)) * 100}%`,
                backgroundColor: '#3bba69'
              }}
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
                  >
                    <div className={cn(
                      "relative flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-500 mb-2 z-10",
                      isCompleted && "bg-[#3bba69] text-white",
                      isCurrent && "border-2 border-[#3bba69] text-[#3bba69]" + " bg-[#0d1f1a]",
                      isPending && "bg-white/5 text-white/30 border border-white/10"
                    )}>
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </div>
                    <p className={cn(
                      "text-[10px] font-medium text-center max-w-[70px]",
                      isCompleted && "text-[#3bba69]",
                      isCurrent && "text-[#3bba69] font-semibold",
                      isPending && "text-white/40"
                    )}>
                      {stage.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick Actions Grid - Dark Theme matching reference */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Archive Card */}
          <Link
            to="/setup"
            className="group relative overflow-hidden rounded-lg p-5 border border-white/10 hover:border-[#3bba69]/30 transition-all duration-300"
            style={{ backgroundColor: '#142721' }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-7 w-7 rounded bg-white/10 flex items-center justify-center">
                <Mail className="h-4 w-4 text-white/60" />
              </div>
              <span className="text-white/60 text-sm">Archive</span>
            </div>
            <div className="flex items-end justify-between">
              <p className="text-2xl font-bold text-white">{documents.length}</p>
              {/* Mini Bar Chart */}
              <div className="flex items-end gap-0.5">
                {[3, 5, 2, 6, 4, 7, 5].map((h, i) => (
                  <div key={i} className="w-1" style={{ height: `${h * 2}px`, backgroundColor: i % 2 === 0 ? '#3bba69' : '#fbbf24' }} />
                ))}
              </div>
            </div>
          </Link>

          {/* Active Card */}
          <Link
            to="/concepts"
            className="group relative overflow-hidden rounded-lg p-5 border border-white/10 hover:border-[#3bba69]/30 transition-all duration-300"
            style={{ backgroundColor: '#142721' }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-7 w-7 rounded bg-[#3bba69]/20 flex items-center justify-center">
                <Zap className="h-4 w-4 text-[#3bba69]" />
              </div>
              <span className="text-white/60 text-sm">Active</span>
            </div>
            <div className="flex items-end justify-between">
              <p className="text-2xl font-bold text-white">{concepts.length || 0}</p>
              <div className="flex items-end gap-0.5">
                {[4, 6, 3, 5, 7, 4, 6].map((h, i) => (
                  <div key={i} className="w-1" style={{ height: `${h * 2}px`, backgroundColor: i % 2 === 0 ? '#3bba69' : '#fbbf24' }} />
                ))}
              </div>
            </div>
          </Link>

          {/* Drafts Card */}
          <Link
            to="/structure"
            className="group relative overflow-hidden rounded-lg p-5 border border-white/10 hover:border-[#3bba69]/30 transition-all duration-300"
            style={{ backgroundColor: '#142721' }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-7 w-7 rounded bg-amber-500/20 flex items-center justify-center">
                <Layout className="h-4 w-4 text-amber-400" />
              </div>
              <span className="text-white/60 text-sm">Drafts</span>
            </div>
            <div className="flex items-end justify-between">
              <p className="text-2xl font-bold text-white">8</p>
              <div className="flex items-end gap-0.5">
                {[5, 3, 6, 4, 7, 5, 3].map((h, i) => (
                  <div key={i} className="w-1" style={{ height: `${h * 2}px`, backgroundColor: i % 2 === 0 ? '#3bba69' : '#fbbf24' }} />
                ))}
              </div>
            </div>
          </Link>

          {/* InActive Card */}
          <Link
            to="/emails"
            className="group relative overflow-hidden rounded-lg p-5 border border-white/10 hover:border-[#3bba69]/30 transition-all duration-300"
            style={{ backgroundColor: '#142721' }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-7 w-7 rounded bg-white/10 flex items-center justify-center">
                <Mail className="h-4 w-4 text-white/60" />
              </div>
              <span className="text-white/60 text-sm">InActive</span>
            </div>
            <div className="flex items-end justify-between">
              <p className="text-2xl font-bold text-white">{sequences.length || 0}</p>
              <div className="flex items-end gap-0.5">
                {[2, 4, 3, 5, 2, 4, 3].map((h, i) => (
                  <div key={i} className="w-1" style={{ height: `${h * 2}px`, backgroundColor: i % 2 === 0 ? '#3bba69' : '#fbbf24' }} />
                ))}
              </div>
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
            <div className="rounded-xl p-5 border border-white/10 relative overflow-hidden" style={{ backgroundColor: '#142721' }}>
              <div className="flex items-start gap-4 relative z-10">
                <div className="flex items-center justify-center h-12 w-12 rounded-xl shrink-0" style={{ backgroundColor: 'rgba(59, 186, 105, 0.2)' }}>
                  <span className="text-2xl">{currentStep.emoji}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="h-3.5 w-3.5 text-[#3bba69]" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#3bba69]">Next Step</span>
                  </div>
                  <h3 className="font-bold text-white text-base">{currentStep.title}</h3>
                  <p className="text-sm text-white/60 mt-1 leading-relaxed">
                    {currentStep.description}
                  </p>
                </div>
                <Link
                  to={currentStep.link}
                  className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium text-sm transition-all hover:scale-105 shrink-0"
                  style={{ background: 'linear-gradient(135deg, #3bba69, #279b65)' }}
                >
                  {currentStep.action}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Mobile action button */}
              <Link
                to={currentStep.link}
                className="md:hidden mt-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-white font-medium text-sm transition-all w-full"
                style={{ background: 'linear-gradient(135deg, #3bba69, #279b65)' }}
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
