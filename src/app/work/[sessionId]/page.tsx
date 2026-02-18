import { getSession } from '@/lib/actions-session';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import Link from 'next/link';
import { ArrowLeft, Maximize2, X, FileText, LayoutTemplate, MoreHorizontal } from 'lucide-react';
import { ResourceProvider } from '@/context/ResourceContext';
import ResourceViewer from '@/components/workspace/ResourceViewer';
import AgentCanvas from '@/components/workspace/AgentCanvas';
import ResourceInitializer from '@/components/workspace/ResourceInitializer';
import { WorkspaceErrorBoundary } from '@/components/ErrorBoundary';

export default async function WorkspacePage({ params }: { params: Promise<{ sessionId: string }> }) {
    const { sessionId } = await params;
    const session = await auth();
    if (!session) redirect('/login');

    const workSession = await getSession(sessionId);
    if (!workSession) notFound();

    // Map Transcript with suggested actions
    const transcript = (workSession.transcript || []).map((t: any) => ({
        _id: t._id?.toString(),
        role: t.role,
        content: t.content,
        widgetType: t.widgetType,
        widgetData: t.widgetData,
        suggestedActions: t.suggestedActions,
        timestamp: t.timestamp
    }));

    // Adapter: Convert Quick Study roadmap format to AgentCanvas milestone format
    let milestones = workSession.milestones || [];
    if (workSession.startedVia === 'quick_study' && workSession.roadmap?.milestones) {
        milestones = workSession.roadmap.milestones.map((milestone: string) => {
            const isCompleted = workSession.roadmap.completedMilestones?.includes(milestone);
            return {
                label: milestone,
                status: isCompleted ? 'completed' : 'pending',
                reasoning: isCompleted ? 'Completed' : ''
            };
        });
    }

    return (
        <WorkspaceErrorBoundary>
            <ResourceProvider>
            <div className="h-screen w-full bg-[#f8f9fa] text-gray-900 flex flex-col overflow-hidden font-[family-name:var(--font-plus-jakarta)]">

                {/* Header (Clean, Light) */}
                <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0 relative z-20">
                    <div className="flex items-center gap-4">
                        <Link href={`/dashboard/courses/${workSession.courseId}`} className="p-2 hover:bg-gray-50 rounded-full text-gray-400 hover:text-gray-900 transition-colors">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                                {workSession.topicName}
                            </h1>
                            <p className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                <span>Live Session</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="hidden md:flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100 text-xs font-bold text-gray-500 mr-4">
                            <FileText size={12} />
                            <span className="max-w-[150px] truncate">{workSession.activeResource?.title || "No Resource"}</span>
                        </div>

                        <button className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-gray-900 transition-colors">
                            <LayoutTemplate size={20} />
                        </button>
                        <button className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-gray-900 transition-colors">
                            <MoreHorizontal size={20} />
                        </button>
                    </div>
                </header>

                {/* SPLIT SCREEN LAYOUT (Light Mode) */}
                <div className="flex-1 flex overflow-hidden bg-[#f8f9fa]">

                    {/* LEFT: Resource Viewer (55% - Paper Style) */}
                    <div className="w-[55%] relative flex flex-col p-6 pr-3">
                        <div className="flex-1 bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden relative">
                            {/* Initialize resource from session */}
                            {workSession.activeResource && (
                                <ResourceInitializer
                                    resourceId={(workSession.activeResource as any)._id?.toString() || workSession.activeResource.id}
                                    resourceTitle={workSession.activeResource.title}
                                    fileUrl={workSession.activeResource.fileUrl}
                                    fileType={workSession.activeResource.type}
                                    initialHighlights={workSession.highlights || []}
                                    availableResources={workSession.availableResources || []}
                                />
                            )}
                            <ResourceViewer />
                        </div>
                    </div>

                    {/* RIGHT: Agent Canvas (45%) */}
                    <div className="w-[45%] relative flex flex-col p-6 pl-3">
                        <div className="flex-1 bg-white rounded-[32px] shadow-lg shadow-gray-100/50 border border-gray-100 overflow-hidden">
                            <AgentCanvas
                                sessionId={workSession._id.toString()}
                                topicName={workSession.topicName}
                                courseId={workSession.courseId?.toString() || null}
                                initialTranscript={transcript}
                                initialProgress={{
                                    conceptsCovered: workSession.progress?.conceptsCovered || [],
                                    estimatedTotal: workSession.progress?.estimatedTotal || 5,
                                    isComplete: workSession.progress?.isComplete || false
                                }}
                                initialMilestones={milestones}
                                initialParkingLot={workSession.parkingLot || []}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </ResourceProvider>
        </WorkspaceErrorBoundary>
    );
}
