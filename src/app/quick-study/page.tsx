import { auth } from "@/auth";
import { getCourses } from "@/lib/actions-course";
import { startQuickStudy } from "@/lib/actions-session";
import { redirect } from "next/navigation";
import QuickStudyShell from "@/components/quick-study/QuickStudyShell";

type Props = {
  searchParams: Promise<{ courseId?: string }>;
};

export default async function QuickStudyPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const courses = await getCourses();
  const { courseId: preselectedCourseId } = await searchParams;

  return (
    <QuickStudyShell
      courses={courses}
      preselectedCourseId={preselectedCourseId}
      action={startQuickStudy}
    />
  );
}
